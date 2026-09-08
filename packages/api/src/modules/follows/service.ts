import { prisma } from "../../db";

export class FollowError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) throw new FollowError("نمی‌توانی خودت را دنبال کنی");
  const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
  if (!target) throw new FollowError("کاربر یافت نشد", 404);

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });
}

export async function unfollowUser(followerId: string, followingId: string) {
  await prisma.follow.deleteMany({ where: { followerId, followingId } });
}

export async function getFollowStatus(followerId: string, followingId: string) {
  const [following, followerCount, followingCount] = await Promise.all([
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId, followingId } } }),
    prisma.follow.count({ where: { followingId } }),
    prisma.follow.count({ where: { followerId: followingId } }),
  ]);
  return { following: !!following, followerCount, followingCount };
}

/** Used by the feed ranking algorithm - who does this user already follow. */
export async function getFollowingIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
  return new Set(rows.map((r) => r.followingId));
}
