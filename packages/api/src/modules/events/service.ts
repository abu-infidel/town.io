import { prisma } from "../../db";
import { decodeCursor, encodeCursor } from "../../lib/cursor";
import { decideModerationStatus } from "../../lib/moderationDecision";
import { moderationProvider } from "../../providers/moderation";
import { assertOwnsMedia, getPublicMediaUrls } from "../media/service";
import { eventPostCommentCounts } from "../comments/service";
import { MAX_PAGE_SIZE } from "@mahalle/shared";

export class EventError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const VISIBLE_STATUSES = ["auto_approved", "approved"] as const;

interface CreateEventInput {
  title: string;
  description: string;
  location?: string;
  startAt: string;
  endAt?: string;
  coverMediaId?: string;
}

export async function createEvent(userId: string, data: CreateEventInput) {
  if (data.coverMediaId) await assertOwnsMedia(userId, [data.coverMediaId]);

  const moderation = await moderationProvider.review({ kind: "text", text: `${data.title}\n${data.description}` });
  const moderationStatus = decideModerationStatus(moderation);

  return prisma.event.create({
    data: {
      creatorId: userId,
      title: data.title,
      description: data.description,
      location: data.location,
      startAt: new Date(data.startAt),
      endAt: data.endAt ? new Date(data.endAt) : undefined,
      coverMediaId: data.coverMediaId,
      moderationStatus,
      moderationNote: moderation.reasoning,
    },
  });
}

export async function deleteEvent(userId: string, eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.creatorId !== userId) throw new EventError("دسترسی غیرمجاز", 403);
  await prisma.event.delete({ where: { id: eventId } });
}

export async function listEvents(viewerId: string, when: "upcoming" | "past", cursor?: string, limit = 20) {
  const take = Math.min(limit, MAX_PAGE_SIZE);
  const offset = decodeCursor(cursor);
  const now = new Date();

  const events = await prisma.event.findMany({
    where: {
      OR: [{ moderationStatus: { in: [...VISIBLE_STATUSES] } }, { creatorId: viewerId }],
      startAt: when === "upcoming" ? { gte: now } : { lt: now },
    },
    orderBy: { startAt: when === "upcoming" ? "asc" : "desc" },
    skip: offset,
    take: take + 1,
    include: {
      creator: { select: { id: true, displayName: true } },
      _count: { select: { rsvps: true } },
    },
  });

  const hasMore = events.length > take;
  const page = events.slice(0, take);
  const coverUrls = await getPublicMediaUrls(page.map((e) => e.coverMediaId).filter((id): id is string => !!id));

  const dtos = page.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startAt: e.startAt,
    endAt: e.endAt,
    creator: e.creator,
    coverUrl: e.coverMediaId ? (coverUrls.get(e.coverMediaId) ?? null) : null,
    rsvpCount: e._count.rsvps,
  }));

  return { events: dtos, nextCursor: hasMore ? encodeCursor(offset + take) : null };
}

export async function getEvent(viewerId: string, eventId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, OR: [{ moderationStatus: { in: [...VISIBLE_STATUSES] } }, { creatorId: viewerId }] },
    include: { creator: { select: { id: true, displayName: true } }, _count: { select: { rsvps: true } } },
  });
  if (!event) throw new EventError("رویداد یافت نشد", 404);

  const [coverUrl, myRsvp] = await Promise.all([
    event.coverMediaId ? getPublicMediaUrls([event.coverMediaId]).then((m) => m.get(event.coverMediaId!) ?? null) : null,
    prisma.eventRsvp.findUnique({ where: { eventId_userId: { eventId, userId: viewerId } } }),
  ]);

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startAt: event.startAt,
    endAt: event.endAt,
    creator: event.creator,
    coverUrl,
    rsvpCount: event._count.rsvps,
    viewerGoing: !!myRsvp,
  };
}

export async function toggleRsvp(userId: string, eventId: string) {
  const existing = await prisma.eventRsvp.findUnique({ where: { eventId_userId: { eventId, userId } } });
  if (existing) {
    await prisma.eventRsvp.delete({ where: { id: existing.id } });
    return { going: false };
  }
  await prisma.eventRsvp.create({ data: { eventId, userId } });
  return { going: true };
}

// --- Event mini-feed ("show their angle of the event" - req 7) ---

export async function createEventPost(userId: string, eventId: string, text: string, mediaIds: string[] = []) {
  await assertOwnsMedia(userId, mediaIds);

  const moderation = await moderationProvider.review({ kind: "text", text });
  const moderationStatus = decideModerationStatus(moderation);

  return prisma.eventPost.create({
    data: {
      eventId,
      authorId: userId,
      text,
      moderationStatus,
      moderationNote: moderation.reasoning,
      media: { create: mediaIds.map((mediaId, order) => ({ mediaId, order })) },
    },
  });
}

export async function deleteEventPost(userId: string, eventPostId: string) {
  const post = await prisma.eventPost.findUnique({ where: { id: eventPostId } });
  if (!post || post.authorId !== userId) throw new EventError("دسترسی غیرمجاز", 403);
  await prisma.eventPost.delete({ where: { id: eventPostId } });
}

export async function toggleEventPostLike(userId: string, eventPostId: string) {
  const existing = await prisma.like.findUnique({ where: { userId_eventPostId: { userId, eventPostId } } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }
  await prisma.like.create({ data: { userId, eventPostId } });
  return { liked: true };
}

export async function listEventPosts(viewerId: string, eventId: string, cursor?: string, limit = 20) {
  const take = Math.min(limit, MAX_PAGE_SIZE);
  const offset = decodeCursor(cursor);

  const posts = await prisma.eventPost.findMany({
    where: { eventId, OR: [{ moderationStatus: { in: [...VISIBLE_STATUSES] } }, { authorId: viewerId }] },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: take + 1,
    include: {
      author: { select: { id: true, displayName: true } },
      media: { orderBy: { order: "asc" } },
      _count: { select: { likes: true } },
    },
  });

  const hasMore = posts.length > take;
  const page = posts.slice(0, take);
  const postIds = page.map((p) => p.id);
  const allMediaIds = page.flatMap((p) => p.media.map((m) => m.mediaId));

  const [commentCounts, likedRows, mediaUrls] = await Promise.all([
    eventPostCommentCounts(postIds),
    prisma.like.findMany({ where: { userId: viewerId, eventPostId: { in: postIds } }, select: { eventPostId: true } }),
    getPublicMediaUrls(allMediaIds),
  ]);
  const likedSet = new Set(likedRows.map((r) => r.eventPostId));

  const dtos = page.map((post) => ({
    id: post.id,
    text: post.text,
    createdAt: post.createdAt,
    author: post.author,
    media: post.media.map((m) => mediaUrls.get(m.mediaId)).filter((u): u is string => !!u),
    likeCount: post._count.likes,
    commentCount: commentCounts.get(post.id) ?? 0,
    likedByViewer: likedSet.has(post.id),
  }));

  return { posts: dtos, nextCursor: hasMore ? encodeCursor(offset + take) : null };
}
