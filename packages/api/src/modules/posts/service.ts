import { prisma } from "../../db";
import { decodeCursor, encodeCursor } from "../../lib/cursor";
import { rankItems } from "../../lib/ranking";
import { decideModerationStatus } from "../../lib/moderationDecision";
import { moderationProvider } from "../../providers/moderation";
import { assertOwnsMedia, getPublicMediaUrls } from "../media/service";
import { getFollowingIds } from "../follows/service";
import { MAX_PAGE_SIZE } from "@mahalle/shared";

export class PostError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const VISIBLE_STATUSES = ["auto_approved", "approved"] as const;
const FEED_WINDOW = 150;

export async function createPost(userId: string, text: string, mediaIds: string[] = []) {
  await assertOwnsMedia(userId, mediaIds);

  const moderation = await moderationProvider.review({ kind: "text", text });
  const moderationStatus = decideModerationStatus(moderation);

  return prisma.post.create({
    data: {
      authorId: userId,
      text,
      moderationStatus,
      moderationNote: moderation.reasoning,
      media: { create: mediaIds.map((mediaId, order) => ({ mediaId, order })) },
    },
  });
}

export async function deletePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== userId) throw new PostError("دسترسی غیرمجاز", 403);
  await prisma.post.delete({ where: { id: postId } });
}

export async function toggleLike(userId: string, postId: string) {
  const existing = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }
  await prisma.like.create({ data: { userId, postId } });
  return { liked: true };
}

async function toFeedDto(
  posts: Awaited<ReturnType<typeof fetchWindow>>,
  viewerId: string,
  viewerNeighborhood: string | null
) {
  const postIds = posts.map((p) => p.id);
  const allMediaIds = posts.flatMap((p) => p.media.map((m) => m.mediaId));

  const [likedRows, mediaUrls] = await Promise.all([
    prisma.like.findMany({ where: { userId: viewerId, postId: { in: postIds } }, select: { postId: true } }),
    getPublicMediaUrls(allMediaIds),
  ]);
  const likedSet = new Set(likedRows.map((r) => r.postId));

  return posts.map((post) => ({
    id: post.id,
    text: post.text,
    createdAt: post.createdAt,
    author: {
      id: post.author.id,
      displayName: post.author.displayName,
      handle: post.author.profile?.handle ?? null,
      neighborhood: post.author.neighborhood,
    },
    media: post.media.map((m) => mediaUrls.get(m.mediaId)).filter((url): url is string => !!url),
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByViewer: likedSet.has(post.id),
    sameNeighborhood: !!viewerNeighborhood && post.author.neighborhood === viewerNeighborhood,
  }));
}

function fetchWindow(viewerId: string) {
  return prisma.post.findMany({
    where: { OR: [{ moderationStatus: { in: [...VISIBLE_STATUSES] } }, { authorId: viewerId }] },
    orderBy: { createdAt: "desc" },
    take: FEED_WINDOW,
    include: {
      author: { select: { id: true, displayName: true, neighborhood: true, profile: { select: { handle: true } } } },
      media: { orderBy: { order: "asc" } },
      _count: { select: { likes: true, comments: true } },
    },
  });
}

export async function listFeed(viewerId: string, viewerNeighborhood: string | null, cursor?: string, limit = 20) {
  const take = Math.min(limit, MAX_PAGE_SIZE);
  const offset = decodeCursor(cursor);

  const window = await fetchWindow(viewerId);
  const followingIds = await getFollowingIds(viewerId);
  const neighborhoodAuthorIds = new Set(
    window.filter((p) => viewerNeighborhood && p.author.neighborhood === viewerNeighborhood).map((p) => p.authorId)
  );

  const ranked = rankItems(
    window.map((p) => ({
      id: p.id,
      authorId: p.authorId,
      createdAt: p.createdAt,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
    })),
    { followingIds, neighborhoodAuthorIds }
  );
  const rankedIds = new Set(ranked.slice(offset, offset + take).map((r) => r.id));
  const page = window.filter((p) => rankedIds.has(p.id));
  // Preserve the ranked order (Array.filter keeps `window`'s order, not the rank order).
  const orderIndex = new Map(ranked.map((r, i) => [r.id, i]));
  page.sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0));

  const dtos = await toFeedDto(page, viewerId, viewerNeighborhood);
  const hasMore = offset + take < ranked.length;

  return { posts: dtos, nextCursor: hasMore ? encodeCursor(offset + take) : null };
}
