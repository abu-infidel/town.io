import { randomInt, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function generateOtpCode(): string {
  // 5 digits, zero-padded. Short enough to type quickly on a feature phone's
  // SMS app, long enough (100,000 possibilities) combined with attempt
  // limiting + expiry to resist brute force.
  return String(randomInt(0, 100000)).padStart(5, "0");
}

const KEY_LEN = 64;

export function hashSecret(secret: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(secret, salt, KEY_LEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifySecret(secret: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(secret, salt, KEY_LEN);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}
