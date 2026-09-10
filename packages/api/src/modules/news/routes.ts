import { Router } from "express";
import { createNewsItemSchema, paginationSchema } from "@mahalle/shared";
import { requireAuth } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rateLimit";
import { MediaError } from "../media/service";
import { NewsError, createNewsItem, deleteNewsItem, listNews } from "./service";

export const newsRouter = Router();

const createLimiter = rateLimit({ keyPrefix: "rl:news-create", points: 10, durationSec: 60 * 60 });

newsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { cursor, limit } = paginationSchema.parse(req.query);
    res.json(await listNews(req.user!.id, cursor, limit));
  } catch (err) {
    next(err);
  }
});

newsRouter.post("/", requireAuth, createLimiter, async (req, res, next) => {
  try {
    const data = createNewsItemSchema.parse(req.body);
    res.json(await createNewsItem(req.user!.id, data));
  } catch (err) {
    if (err instanceof NewsError || err instanceof MediaError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

newsRouter.delete("/:newsId", requireAuth, async (req, res, next) => {
  try {
    await deleteNewsItem(req.user!.id, req.params.newsId);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof NewsError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});
