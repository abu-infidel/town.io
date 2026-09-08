/**
 * Opaque offset cursor - not meant as a security boundary, just a soft
 * anti-scraping measure (req 14): a plain `?offset=` query param invites
 * "just increment this and dump everything," this doesn't.
 */
export function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const parsed = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
