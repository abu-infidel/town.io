import { prisma } from "../../db";
import { decodeCursor, encodeCursor } from "../../lib/cursor";
import { rankItems } from "../../lib/ranking";
import { assertOwnsVideoMedia, getMediaStatuses } from "../media/service";
import { getFollowingIds } from "../follows/service";
import { MAX_PAGE_SIZE } from "@mahalle/shared";

export class ReelError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const PUBLICLY_VISIBLE = new Set(["auto_approved", "approved"]);
const FEED_WINDOW = 150;

export async function createReel(userId: string, mediaId: string, caption?: string) {
  await assertOwnsVideoMedia(userId, mediaId);
  return prisma.reel.create({ data: { authorId: userId, mediaId, caption } });
}

export async function deleteReel(userId: string, reelId: string) {
  const reel = await prisma.reel.findUnique({ where: { id: reelId } });
  if (!reel || reel.authorId !== userId) throw new ReelError("دسترسی غیرمجاز", 403);
  await prisma.reel.delete({ where: { id: reelId } });
}

export async function toggleLike(userId: string, reelId: string) {
  const existing = await prisma.like.findUnique({ where: { userId_reelId: { userId, reelId } } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }
  await prisma.like.create({ data: { userId, reelId } });
  return { liked: true };
}

function fetchWindow() {
  return prisma.reel.findMany({
    orderBy: { createdAt: "desc" },
    take: FEED_WINDOW,
    include: {
      author: { select: { id: true, displayName: true, neighborhood: true, profile: { select: { handle: true } } } },
      _count: { select: { likes: true, comments: true } },
    },
  });
}

export async function listReelFeed(viewerId: string, viewerNeighborhood: string | null, cursor?: string, limit = 10) {
  const take = Math.min(limit, MAX_PAGE_SIZE);
  const offset = decodeCursor(cursor);

  const window = await fetchWindow();
  const mediaStatuses = await getMediaStatuses(window.map((r) => r.mediaId));

  // A reel IS its video - visible once that video clears moderation, or
  // always to its own author so they see it immediately after posting.
  const visible = window.filter((r) => {
    const media = mediaStatuses.get(r.mediaId);
    if (!media) return false;
    return r.authorId === viewerId || PUBLICLY_VISIBLE.has(media.moderationStatus);
  });

  const followingIds = await getFollowingIds(viewerId);
  const neighborhoodAuthorIds = new Set(
    visible.filter((r) => viewerNeighborhood && r.author.neighborhood === viewerNeighborhood).map((r) => r.authorId)
  );

  const ranked = rankItems(
    visible.map((r) => ({
      id: r.id,
      authorId: r.authorId,
      createdAt: r.createdAt,
      likeCount: r._count.likes,
      commentCount: r._count.comments,
    })),
    { followingIds, neighborhoodAuthorIds }
  );

  const pageIds = ranked.slice(offset, offset + take).map((r) => r.id);
  const orderIndex = new Map(pageIds.map((id, i) => [id, i]));
  const page = visible.filter((r) => orderIndex.has(r.id)).sort((a, b) => orderIndex.get(a.id)! - orderIndex.get(b.id)!);

  const likedRows = await prisma.like.findMany({
    where: { userId: viewerId, reelId: { in: pageIds } },
    select: { reelId: true },
  });
  const likedSet = new Set(likedRows.map((r) => r.reelId));

  const dtos = page.map((reel) => {
    const media = mediaStatuses.get(reel.mediaId)!;
    return {
      id: reel.id,
      caption: reel.caption,
      createdAt: reel.createdAt,
      videoUrl: media.processedKey ? `/media/${media.processedKey}` : null,
      pending: !PUBLICLY_VISIBLE.has(media.moderationStatus),
      author: {
        id: reel.author.id,
        displayName: reel.author.displayName,
        handle: reel.author.profile?.handle ?? null,
      },
      likeCount: reel._count.likes,
      commentCount: reel._count.comments,
      likedByViewer: likedSet.has(reel.id),
    };
  });

  return { reels: dtos, nextCursor: offset + take < ranked.length ? encodeCursor(offset + take) : null };
}
