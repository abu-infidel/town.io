import { Router } from "express";
import { createCommentSchema, createPostSchema, paginationSchema } from "@mahalle/shared";
import { requireAuth } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rateLimit";
import { MediaError } from "../media/service";
import { PostError, createPost, deletePost, listFeed, toggleLike } from "./service";
import { addComment, deleteComment, listComments } from "../comments/service";

export const postsRouter = Router();

const createLimiter = rateLimit({ keyPrefix: "rl:post-create", points: 20, durationSec: 60 * 60 });

postsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { cursor, limit } = paginationSchema.parse(req.query);
    res.json(await listFeed(req.user!.id, req.user!.neighborhood, cursor, limit));
  } catch (err) {
    next(err);
  }
});

postsRouter.post("/", requireAuth, createLimiter, async (req, res, next) => {
  try {
    const { text, mediaIds } = createPostSchema.parse(req.body);
    const post = await createPost(req.user!.id, text, mediaIds);
    res.json(post);
  } catch (err) {
    if (err instanceof PostError || err instanceof MediaError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

postsRouter.delete("/:postId", requireAuth, async (req, res, next) => {
  try {
    await deletePost(req.user!.id, req.params.postId);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof PostError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

postsRouter.post("/:postId/like", requireAuth, async (req, res, next) => {
  try {
    res.json(await toggleLike(req.user!.id, req.params.postId));
  } catch (err) {
    next(err);
  }
});

postsRouter.get("/:postId/comments", requireAuth, async (req, res, next) => {
  try {
    const { cursor, limit } = paginationSchema.parse(req.query);
    res.json(await listComments({ postId: req.params.postId }, cursor, limit));
  } catch (err) {
    next(err);
  }
});

postsRouter.post("/:postId/comments", requireAuth, async (req, res, next) => {
  try {
    const { text } = createCommentSchema.parse(req.body);
    res.json(await addComment(req.user!.id, { postId: req.params.postId }, text));
  } catch (err) {
    next(err);
  }
});

postsRouter.delete("/comments/:commentId", requireAuth, async (req, res, next) => {
  try {
    await deleteComment(req.user!.id, req.params.commentId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
