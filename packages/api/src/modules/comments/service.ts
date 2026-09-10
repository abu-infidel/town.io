import { prisma } from "../../db";
import { decodeCursor, encodeCursor } from "../../lib/cursor";
import { MAX_PAGE_SIZE } from "@mahalle/shared";

export class CommentError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export type CommentTarget = { postId: string } | { reelId: string } | { eventPostId: string };

export async function addComment(userId: string, target: CommentTarget, text: string) {
  return prisma.comment.create({
    data: { authorId: userId, text, ...target },
    include: { author: { select: { displayName: true, profile: { select: { handle: true } } } } },
  });
}

export async function listComments(target: CommentTarget, cursor: string | undefined, limit = 20) {
  const offset = decodeCursor(cursor);
  const take = Math.min(limit, MAX_PAGE_SIZE);

  const comments = await prisma.comment.findMany({
    where: target,
    orderBy: { createdAt: "asc" },
    skip: offset,
    take: take + 1,
    include: { author: { select: { displayName: true, profile: { select: { handle: true } } } } },
  });

  const hasMore = comments.length > take;
  const page = comments.slice(0, take);

  return { comments: page, nextCursor: hasMore ? encodeCursor(offset + take) : null };
}

export async function deleteComment(userId: string, commentId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.authorId !== userId) throw new CommentError("دسترسی غیرمجاز", 403);
  await prisma.comment.delete({ where: { id: commentId } });
}

export async function postCommentCounts(postIds: string[]): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();
  const grouped = await prisma.comment.groupBy({
    by: ["postId"],
    where: { postId: { in: postIds } },
    _count: { _all: true },
  });
  return new Map(grouped.filter((r) => r.postId).map((r) => [r.postId as string, r._count._all]));
}

export async function reelCommentCounts(reelIds: string[]): Promise<Map<string, number>> {
  if (reelIds.length === 0) return new Map();
  const grouped = await prisma.comment.groupBy({
    by: ["reelId"],
    where: { reelId: { in: reelIds } },
    _count: { _all: true },
  });
  return new Map(grouped.filter((r) => r.reelId).map((r) => [r.reelId as string, r._count._all]));
}

export async function eventPostCommentCounts(eventPostIds: string[]): Promise<Map<string, number>> {
  if (eventPostIds.length === 0) return new Map();
  const grouped = await prisma.comment.groupBy({
    by: ["eventPostId"],
    where: { eventPostId: { in: eventPostIds } },
    _count: { _all: true },
  });
  return new Map(grouped.filter((r) => r.eventPostId).map((r) => [r.eventPostId as string, r._count._all]));
}
