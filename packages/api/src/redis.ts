import Redis from "ioredis";
import { env } from "./env";

// General-purpose client (rate limiting, sessions/pubsub later). Fails fast
// instead of queueing commands forever when Redis is briefly unreachable -
// without this, a Redis blip would make every rate-limited request hang
// indefinitely rather than degrading gracefully (see middleware/rateLimit.ts,
// which fails *open* on a real connection error rather than blocking all
// traffic).
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  connectTimeout: 3000,
});

// BullMQ requires maxRetriesPerRequest: null on the connection it's given -
// kept as its own client so that requirement doesn't leak into the rest of
// the app's Redis usage above.
export const queueRedis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

// ioredis emits a noisy "Unhandled error event" per failed reconnect attempt
// if nothing listens for 'error'; log one quiet line per client instead.
redis.on("error", (err) => console.error("[redis] connection error:", err.message));
queueRedis.on("error", (err) => console.error("[queueRedis] connection error:", err.message));
