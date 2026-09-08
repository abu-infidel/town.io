/**
 * Feed ranking (req 28: "promote content to the user's liking but not too
 * aggressive"). Deliberately a small, readable formula instead of a
 * black-box model - it should be possible to explain in one sentence why
 * something is near the top: newer, from someone you follow or your
 * neighborhood, and with a little (log-scaled, so it can't run away)
 * engagement - plus a small random jitter so the feed doesn't calcify into
 * "whatever already has the most likes."
 *
 * Computed in memory over a bounded recent window (see posts/reels
 * services) rather than as a giant SQL expression - simple to reason about
 * and completely adequate at town scale.
 */
export interface RankableItem {
  id: string;
  authorId: string;
  createdAt: Date;
  likeCount: number;
  commentCount: number;
}

export interface RankingContext {
  followingIds: Set<string>;
  neighborhoodAuthorIds: Set<string>;
}

const RECENCY_HALF_LIFE_HOURS = 30;
const FOLLOWING_BOOST = 0.25;
const NEIGHBORHOOD_BOOST = 0.1;
const ENGAGEMENT_WEIGHT = 0.15;
const JITTER_WEIGHT = 0.1;

export function scoreItem(item: RankableItem, ctx: RankingContext): number {
  const ageHours = (Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60);
  const recency = Math.pow(0.5, ageHours / RECENCY_HALF_LIFE_HOURS);
  const engagement = Math.log1p(item.likeCount + item.commentCount * 2) * ENGAGEMENT_WEIGHT;
  const affinity = ctx.followingIds.has(item.authorId) ? FOLLOWING_BOOST : 0;
  const local = ctx.neighborhoodAuthorIds.has(item.authorId) ? NEIGHBORHOOD_BOOST : 0;
  const jitter = (Math.random() - 0.5) * JITTER_WEIGHT;
  return recency + engagement + affinity + local + jitter;
}

export function rankItems<T extends RankableItem>(items: T[], ctx: RankingContext): T[] {
  return [...items].sort((a, b) => scoreItem(b, ctx) - scoreItem(a, ctx));
}
