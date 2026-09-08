import { Router } from "express";
import { createCommentSchema, createReelSchema, paginationSchema } from "@mahalle/shared";
import { requireAuth } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rateLimit";
import { MediaError } from "../media/service";
import { ReelError, createReel, deleteReel, listReelFeed, toggleLike } from "./service";
import { addComment, deleteComment, listComments } from "../comments/service";

export const reelsRouter = Router();

const createLimiter = rateLimit({ keyPrefix: "rl:reel-create", points: 20, durationSec: 60 * 60 });

reelsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { cursor, limit } = paginationSchema.parse(req.query);
    res.json(await listReelFeed(req.user!.id, req.user!.neighborhood, cursor, limit));
  } catch (err) {
    next(err);
  }
});

reelsRouter.post("/", requireAuth, createLimiter, async (req, res, next) => {
  try {
    const { mediaId, caption } = createReelSchema.parse(req.body);
    res.json(await createReel(req.user!.id, mediaId, caption));
  } catch (err) {
    if (err instanceof ReelError || err instanceof MediaError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

reelsRouter.delete("/:reelId", requireAuth, async (req, res, next) => {
  try {
    await deleteReel(req.user!.id, req.params.reelId);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof ReelError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

reelsRouter.post("/:reelId/like", requireAuth, async (req, res, next) => {
  try {
    res.json(await toggleLike(req.user!.id, req.params.reelId));
  } catch (err) {
    next(err);
  }
});

reelsRouter.get("/:reelId/comments", requireAuth, async (req, res, next) => {
  try {
    const { cursor, limit } = paginationSchema.parse(req.query);
    res.json(await listComments({ reelId: req.params.reelId }, cursor, limit));
  } catch (err) {
    next(err);
  }
});

reelsRouter.post("/:reelId/comments", requireAuth, async (req, res, next) => {
  try {
    const { text } = createCommentSchema.parse(req.body);
    res.json(await addComment(req.user!.id, { reelId: req.params.reelId }, text));
  } catch (err) {
    next(err);
  }
});

reelsRouter.delete("/comments/:commentId", requireAuth, async (req, res, next) => {
  try {
    await deleteComment(req.user!.id, req.params.commentId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
