import { prisma } from "../../db";
import { decodeCursor, encodeCursor } from "../../lib/cursor";
import { decideModerationStatus } from "../../lib/moderationDecision";
import { moderationProvider } from "../../providers/moderation";
import { MAX_PAGE_SIZE } from "@mahalle/shared";

export class PollError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const VISIBLE_STATUSES = ["auto_approved", "approved"] as const;

interface CreatePollInput {
  question: string;
  description?: string;
  options: string[];
  closesAt?: string;
}

export async function createPoll(userId: string, data: CreatePollInput) {
  const moderation = await moderationProvider.review({ kind: "text", text: `${data.question}\n${data.description ?? ""}` });
  const moderationStatus = decideModerationStatus(moderation);

  return prisma.poll.create({
    data: {
      creatorId: userId,
      question: data.question,
      description: data.description,
      closesAt: data.closesAt ? new Date(data.closesAt) : undefined,
      moderationStatus,
      moderationNote: moderation.reasoning,
      options: { create: data.options.map((text, order) => ({ text, order })) },
    },
    include: { options: true },
  });
}

function isClosed(closesAt: Date | null): boolean {
  return !!closesAt && closesAt.getTime() <= Date.now();
}

function fetchPollsWithVotes(args: Parameters<typeof prisma.poll.findMany>[0]) {
  return prisma.poll.findMany({
    ...args,
    include: { options: { orderBy: { order: "asc" }, include: { votes: { select: { id: true } } } } },
  });
}

async function toListDto(polls: Awaited<ReturnType<typeof fetchPollsWithVotes>>, viewerId: string) {
  const pollIds = polls.map((p) => p.id);
  const myVotes = await prisma.pollVote.findMany({ where: { userId: viewerId, pollId: { in: pollIds } } });
  const myVoteByPoll = new Map(myVotes.map((v) => [v.pollId, v.optionId]));

  return polls.map((poll) => {
    const closed = isClosed(poll.closesAt);
    const votedOptionId = myVoteByPoll.get(poll.id) ?? null;
    const revealCounts = closed || !!votedOptionId;
    return {
      id: poll.id,
      question: poll.question,
      description: poll.description,
      closesAt: poll.closesAt,
      closed,
      createdAt: poll.createdAt,
      viewerVotedOptionId: votedOptionId,
      totalVotes: revealCounts ? poll.options.reduce((sum, o) => sum + o.votes.length, 0) : null,
      options: poll.options.map((o) => ({ id: o.id, text: o.text, voteCount: revealCounts ? o.votes.length : null })),
    };
  });
}

export async function listPolls(viewerId: string, cursor?: string, limit = 20) {
  const take = Math.min(limit, MAX_PAGE_SIZE);
  const offset = decodeCursor(cursor);

  const polls = await fetchPollsWithVotes({
    where: { OR: [{ moderationStatus: { in: [...VISIBLE_STATUSES] } }, { creatorId: viewerId }] },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: take + 1,
  });

  const hasMore = polls.length > take;
  const dtos = await toListDto(polls.slice(0, take), viewerId);
  return { polls: dtos, nextCursor: hasMore ? encodeCursor(offset + take) : null };
}

export async function getPoll(viewerId: string, pollId: string) {
  const polls = await fetchPollsWithVotes({
    where: { id: pollId, OR: [{ moderationStatus: { in: [...VISIBLE_STATUSES] } }, { creatorId: viewerId }] },
  });
  if (polls.length === 0) throw new PollError("نظرسنجی یافت نشد", 404);
  const [dto] = await toListDto(polls, viewerId);
  return dto;
}

export async function castVote(userId: string, pollId: string, optionId: string) {
  const poll = await prisma.poll.findUnique({ where: { id: pollId }, include: { options: true } });
  if (!poll) throw new PollError("نظرسنجی یافت نشد", 404);
  if (isClosed(poll.closesAt)) throw new PollError("این نظرسنجی بسته شده است");
  if (!poll.options.some((o) => o.id === optionId)) throw new PollError("گزینه نامعتبر است");

  const existing = await prisma.pollVote.findUnique({ where: { pollId_userId: { pollId, userId } } });
  if (existing) throw new PollError("قبلاً در این نظرسنجی رای داده‌ای");

  await prisma.pollVote.create({ data: { pollId, optionId, userId } });
  return getPoll(userId, pollId);
}

// --- Public results, meant to be handed to local authorities as evidence
// real verified residents voted on an issue (req 23) - always current, never
// gated on the viewer having voted, and never exposes who voted for what.

export async function getPublicResults(pollId: string) {
  const poll = await prisma.poll.findFirst({
    where: { id: pollId, moderationStatus: { in: [...VISIBLE_STATUSES] } },
    include: { options: { orderBy: { order: "asc" }, include: { votes: { select: { id: true } } } } },
  });
  if (!poll) throw new PollError("نظرسنجی یافت نشد", 404);

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
  return {
    id: poll.id,
    question: poll.question,
    description: poll.description,
    closed: isClosed(poll.closesAt),
    totalVotes,
    options: poll.options.map((o) => ({ text: o.text, voteCount: o.votes.length })),
  };
}

export async function getResultsCsv(pollId: string): Promise<string> {
  const results = await getPublicResults(pollId);
  const rows = ["گزینه,تعداد رای", ...results.options.map((o) => `"${o.text.replace(/"/g, '""')}",${o.voteCount}`)];
  return rows.join("\n");
}
