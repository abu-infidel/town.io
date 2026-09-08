import { Queue } from "bullmq";
import { queueRedis } from "../../redis";

export interface MediaProcessJob {
  mediaId: string;
}

export const MEDIA_QUEUE_NAME = "media-process";

export const mediaQueue = new Queue<MediaProcessJob>(MEDIA_QUEUE_NAME, { connection: queueRedis });
