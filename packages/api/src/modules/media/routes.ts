import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rateLimit";
import { env } from "../../env";
import { MediaError, getMediaForOwner, getPublicMediaUrl, ingestUpload } from "./service";

export const mediaRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MEDIA_MAX_VIDEO_MB * 1024 * 1024 },
});

// Uploads are inherently expensive (disk + a transcode job) - keep this
// tighter than general API traffic.
const uploadLimiter = rateLimit({ keyPrefix: "rl:upload", points: 20, durationSec: 60 * 60 });

mediaRouter.post("/upload", requireAuth, uploadLimiter, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "فایلی ارسال نشده است" });
    const media = await ingestUpload(req.user!.id, req.file);
    res.json({
      id: media.id,
      kind: media.kind,
      moderationStatus: media.moderationStatus,
    });
  } catch (err) {
    if (err instanceof MediaError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

mediaRouter.get("/:mediaId/public", async (req, res, next) => {
  try {
    const url = await getPublicMediaUrl(req.params.mediaId);
    if (!url) return res.status(404).json({ error: "یافت نشد" });
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

mediaRouter.get("/:mediaId/status", requireAuth, async (req, res, next) => {
  try {
    const media = await getMediaForOwner(req.user!.id, req.params.mediaId);
    res.json({
      id: media.id,
      moderationStatus: media.moderationStatus,
      processedUrl: media.processedKey ? `/media/${media.processedKey}` : null,
    });
  } catch (err) {
    if (err instanceof MediaError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});
