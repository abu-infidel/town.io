import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Worker } from "bullmq";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import { prisma } from "../db";
import { queueRedis } from "../redis";
import { env } from "../env";
import { MEDIA_QUEUE_NAME, type MediaProcessJob } from "../modules/media/queue";
import { moderationProvider } from "../providers/moderation";
import { decideModerationStatus as decideStatus } from "../lib/moderationDecision";

async function processImage(originalPath: string, outPath: string) {
  const input = sharp(await readFile(originalPath));
  const resized = input.rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true });
  const buffer = await resized.webp({ quality: 82 }).toBuffer();
  const metadata = await sharp(buffer).metadata();
  await writeFile(outPath, buffer);
  return { buffer, width: metadata.width, height: metadata.height };
}

function ffprobeDurationSec(filePath: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return resolve(undefined);
      resolve(data.format.duration ? Math.round(data.format.duration) : undefined);
    });
  });
}

function transcodeVideo(originalPath: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(originalPath)
      .videoFilters("scale='min(1280,iw)':-2")
      .videoCodec("libx264")
      .outputOptions(["-preset veryfast", "-crf 26", "-movflags +faststart"])
      .audioCodec("aac")
      .audioBitrate("128k")
      .on("end", () => resolve())
      .on("error", reject)
      .save(outPath);
  });
}

function extractThumbnail(originalPath: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(originalPath)
      .on("end", () => resolve())
      .on("error", reject)
      .screenshots({ count: 1, timemarks: ["1"], filename: path.basename(outPath), folder: path.dirname(outPath) });
  });
}

async function handleJob({ mediaId }: MediaProcessJob) {
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) return;

  await mkdir(env.MEDIA_PROCESSED_DIR, { recursive: true });
  const originalPath = path.join(env.MEDIA_UPLOAD_DIR, media.storageKey);

  if (media.kind === "image") {
    const processedKey = `${media.id}.webp`;
    const outPath = path.join(env.MEDIA_PROCESSED_DIR, processedKey);
    const { buffer, width, height } = await processImage(originalPath, outPath);

    const result = await moderationProvider.review({
      kind: "image",
      image: { buffer, mimeType: "image/webp" },
    });

    await prisma.media.update({
      where: { id: media.id },
      data: {
        processedKey,
        widthPx: width,
        heightPx: height,
        moderationStatus: decideStatus(result),
        moderationNote: result.reasoning,
      },
    });
    return;
  }

  // video
  const processedKey = `${media.id}.mp4`;
  const thumbKey = `${media.id}.jpg`;
  const outPath = path.join(env.MEDIA_PROCESSED_DIR, processedKey);
  const thumbPath = path.join(env.MEDIA_PROCESSED_DIR, thumbKey);

  await transcodeVideo(originalPath, outPath);
  await extractThumbnail(originalPath, thumbPath);
  const durationSec = await ffprobeDurationSec(outPath);
  const thumbBuffer = await readFile(thumbPath);

  const result = await moderationProvider.review({
    kind: "video_thumbnail",
    image: { buffer: thumbBuffer, mimeType: "image/jpeg" },
  });

  await prisma.media.update({
    where: { id: media.id },
    data: {
      processedKey,
      durationSec,
      moderationStatus: decideStatus(result),
      moderationNote: result.reasoning,
    },
  });
}

const worker = new Worker<MediaProcessJob>(
  MEDIA_QUEUE_NAME,
  async (job) => {
    await handleJob(job.data);
  },
  { connection: queueRedis, concurrency: 2 }
);

worker.on("completed", (job) => console.log(`[worker] processed media job ${job.id}`));
worker.on("failed", (job, err) => console.error(`[worker] media job ${job?.id} failed:`, err));

console.log("[worker] media processing worker started");

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
