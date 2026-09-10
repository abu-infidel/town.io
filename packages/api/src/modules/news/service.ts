import { prisma } from "../../db";
import { decodeCursor, encodeCursor } from "../../lib/cursor";
import { decideModerationStatus } from "../../lib/moderationDecision";
import { moderationProvider } from "../../providers/moderation";
import { assertOwnsMedia, getPublicMediaUrls } from "../media/service";
import { MAX_PAGE_SIZE } from "@mahalle/shared";

export class NewsError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const VISIBLE_STATUSES = ["auto_approved", "approved"] as const;

export async function createNewsItem(userId: string, data: { title: string; body: string; coverMediaId?: string }) {
  if (data.coverMediaId) await assertOwnsMedia(userId, [data.coverMediaId]);

  const moderation = await moderationProvider.review({ kind: "text", text: `${data.title}\n${data.body}` });
  const moderationStatus = decideModerationStatus(moderation);

  return prisma.newsItem.create({
    data: { authorId: userId, ...data, moderationStatus, moderationNote: moderation.reasoning },
  });
}

export async function deleteNewsItem(userId: string, id: string) {
  const item = await prisma.newsItem.findUnique({ where: { id } });
  if (!item || item.authorId !== userId) throw new NewsError("دسترسی غیرمجاز", 403);
  await prisma.newsItem.delete({ where: { id } });
}

// Deliberately no ranking algorithm here - civic news should be complete and
// chronological, not filtered by an engagement model that could bury
// something people needed to see (unlike the /feed and /reels algorithm).
export async function listNews(viewerId: string, cursor?: string, limit = 20) {
  const take = Math.min(limit, MAX_PAGE_SIZE);
  const offset = decodeCursor(cursor);

  const items = await prisma.newsItem.findMany({
    where: { OR: [{ moderationStatus: { in: [...VISIBLE_STATUSES] } }, { authorId: viewerId }] },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: take + 1,
    include: { author: { select: { id: true, displayName: true } } },
  });

  const hasMore = items.length > take;
  const page = items.slice(0, take);
  const coverUrls = await getPublicMediaUrls(page.map((i) => i.coverMediaId).filter((id): id is string => !!id));

  const dtos = page.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    createdAt: item.createdAt,
    author: item.author,
    coverUrl: item.coverMediaId ? (coverUrls.get(item.coverMediaId) ?? null) : null,
  }));

  return { news: dtos, nextCursor: hasMore ? encodeCursor(offset + take) : null };
}
