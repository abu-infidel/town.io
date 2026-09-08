import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { FollowError, followUser, getFollowStatus, unfollowUser } from "./service";

export const followsRouter = Router();

followsRouter.post("/:userId", requireAuth, async (req, res, next) => {
  try {
    await followUser(req.user!.id, req.params.userId);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof FollowError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

followsRouter.delete("/:userId", requireAuth, async (req, res, next) => {
  try {
    await unfollowUser(req.user!.id, req.params.userId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

followsRouter.get("/:userId/status", requireAuth, async (req, res, next) => {
  try {
    res.json(await getFollowStatus(req.user!.id, req.params.userId));
  } catch (err) {
    if (err instanceof FollowError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});
