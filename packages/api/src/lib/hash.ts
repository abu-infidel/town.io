import { createHash } from "node:crypto";

/**
 * Deterministic hash for values we need to look up by equality (session
 * tokens, IP addresses for rate-limit logging). Not for OTP codes -
 * see otp.ts's hashSecret, which uses a salted scrypt hash instead since
 * those are looked up by phone number, not by the hash itself.
 */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
