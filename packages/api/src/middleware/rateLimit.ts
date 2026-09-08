import type { NextFunction, Request, Response } from "express";
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import { redis } from "../redis";

/**
 * Redis-backed rate limiting - part of the anti-scraping/anti-abuse posture
 * (see architecture plan req 14): even a well-behaved client should never
 * need to burst far past normal human usage, so limits here are deliberately
 * tight on read-heavy/enumerable endpoints (search, listings) and even
 * tighter on OTP requests (SMS costs real money per message).
 */
export function rateLimit(opts: { keyPrefix: string; points: number; durationSec: number }) {
  const limiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: opts.keyPrefix,
    points: opts.points,
    duration: opts.durationSec,
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.user?.id ?? req.ip ?? "unknown";
    try {
      await limiter.consume(key);
      next();
    } catch (err) {
      if (err instanceof RateLimiterRes) {
        return res.status(429).json({ error: "درخواست‌های زیاد. کمی صبر کنید." });
      }
      // A real backing-store error (e.g. Redis briefly unreachable) - fail
      // open rather than taking the whole town's platform down over it.
      console.error("[rateLimit] store error, failing open:", err);
      next();
    }
  };
}

export const otpRequestLimiter = rateLimit({ keyPrefix: "rl:otp-request", points: 5, durationSec: 15 * 60 });
export const otpVerifyLimiter = rateLimit({ keyPrefix: "rl:otp-verify", points: 10, durationSec: 15 * 60 });
export const searchLimiter = rateLimit({ keyPrefix: "rl:search", points: 30, durationSec: 60 });
export const generalApiLimiter = rateLimit({ keyPrefix: "rl:general", points: 300, durationSec: 60 });
