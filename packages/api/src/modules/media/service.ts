import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../db";
import { env } from "../../env";
import { mediaQueue } from "./queue";

export class MediaError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export function fileFilterKind(mimeType: string): "image" | "video" | null {
  if (ALLOWED_IMAGE_MIME.has(mimeType)) return "image";
  if (ALLOWED_VIDEO_MIME.has(mimeType)) return "video";
  return null;
}

export async function ingestUpload(
  ownerId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number }
) {
  const kind = fileFilterKind(file.mimetype);
  if (!kind) throw new MediaError("نوع فایل مجاز نیست");

  const maxBytes = (kind === "image" ? env.MEDIA_MAX_IMAGE_MB : env.MEDIA_MAX_VIDEO_MB) * 1024 * 1024;
  if (file.size > maxBytes) throw new MediaError("حجم فایل بیش از حد مجاز است");

  await mkdir(env.MEDIA_UPLOAD_DIR, { recursive: true });
  const storageKey = `${randomBytes(16).toString("hex")}${path.extname(file.originalname).slice(0, 10)}`;
  await writeFile(path.join(env.MEDIA_UPLOAD_DIR, storageKey), file.buffer);

  const media = await prisma.media.create({
    data: {
      ownerId,
      kind,
      originalFilename: file.originalname.slice(0, 200),
      storageKey,
      mimeType: file.mimetype,
      byteSize: file.size,
      moderationStatus: "pending",
    },
  });

  await mediaQueue.add("process", { mediaId: media.id });

  return media;
}

export async function getMediaForOwner(ownerId: string, mediaId: string) {
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media || media.ownerId !== ownerId) throw new MediaError("دسترسی غیرمجاز", 403);
  return media;
}

const PUBLICLY_VISIBLE_STATUSES = new Set(["auto_approved", "approved"]);

/**
 * Used by public pages (e.g. a profile viewed by someone who isn't the
 * owner). Only ever returns a URL once the moderation pipeline has cleared
 * the file - pending/flagged/rejected media stays invisible to everyone but
 * its owner, even if someone guesses/leaks the media id.
 */
export async function getPublicMediaUrl(mediaId: string): Promise<string | null> {
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media || !media.processedKey || !PUBLICLY_VISIBLE_STATUSES.has(media.moderationStatus)) {
    return null;
  }
  return `/media/${media.processedKey}`;
}

/** Bulk variant of getPublicMediaUrl, for rendering a feed page in one query. */
export async function getPublicMediaUrls(mediaIds: string[]): Promise<Map<string, string>> {
  if (mediaIds.length === 0) return new Map();
  const rows = await prisma.media.findMany({
    where: { id: { in: mediaIds }, moderationStatus: { in: ["auto_approved", "approved"] } },
  });
  return new Map(rows.filter((r) => r.processedKey).map((r) => [r.id, `/media/${r.processedKey}`]));
}

export async function assertOwnsMedia(ownerId: string, mediaIds: string[]) {
  if (mediaIds.length === 0) return;
  const count = await prisma.media.count({ where: { id: { in: mediaIds }, ownerId } });
  if (count !== mediaIds.length) throw new MediaError("دسترسی غیرمجاز به یکی از فایل‌ها", 403);
}

export async function assertOwnsVideoMedia(ownerId: string, mediaId: string) {
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media || media.ownerId !== ownerId) throw new MediaError("دسترسی غیرمجاز", 403);
  if (media.kind !== "video") throw new MediaError("ریلز فقط از نوع ویدیو می‌تواند باشد");
  return media;
}

/**
 * Raw status/ownership for a batch of media ids, unfiltered - callers decide
 * their own visibility rule from it (e.g. reels: visible if publicly safe OR
 * viewed by their own owner; post images: only ever the publicly-safe ones).
 */
export async function getMediaStatuses(
  mediaIds: string[]
): Promise<Map<string, { ownerId: string; processedKey: string | null; moderationStatus: string }>> {
  if (mediaIds.length === 0) return new Map();
  const rows = await prisma.media.findMany({ where: { id: { in: mediaIds } } });
  return new Map(rows.map((r) => [r.id, { ownerId: r.ownerId, processedKey: r.processedKey, moderationStatus: r.moderationStatus }]));
}
