import { Router } from "express";
import { castVoteSchema, createPollSchema, paginationSchema } from "@mahalle/shared";
import { requireAuth } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rateLimit";
import { PollError, castVote, createPoll, getPoll, getPublicResults, getResultsCsv, listPolls } from "./service";

export const pollsRouter = Router();

const createLimiter = rateLimit({ keyPrefix: "rl:poll-create", points: 5, durationSec: 60 * 60 });

function handle(err: unknown, next: (e?: unknown) => void, res: import("express").Response) {
  if (err instanceof PollError) return res.status(err.status).json({ error: err.message });
  next(err);
}

pollsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { cursor, limit } = paginationSchema.parse(req.query);
    res.json(await listPolls(req.user!.id, cursor, limit));
  } catch (err) {
    handle(err, next, res);
  }
});

pollsRouter.post("/", requireAuth, createLimiter, async (req, res, next) => {
  try {
    const data = createPollSchema.parse(req.body);
    res.json(await createPoll(req.user!.id, data));
  } catch (err) {
    handle(err, next, res);
  }
});

// Public - meant to be shared with local authorities as evidence, no login
// wall (see service.ts comment on getPublicResults).
pollsRouter.get("/:pollId/results", async (req, res, next) => {
  try {
    res.json(await getPublicResults(req.params.pollId));
  } catch (err) {
    handle(err, next, res);
  }
});

pollsRouter.get("/:pollId/results.csv", async (req, res, next) => {
  try {
    const csv = await getResultsCsv(req.params.pollId);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="poll-${req.params.pollId}.csv"`);
    // Leading UTF-8 BOM so Excel opens the Persian text correctly instead of guessing ANSI.
    res.send("\uFEFF" + csv);
  } catch (err) {
    handle(err, next, res);
  }
});

pollsRouter.get("/:pollId", requireAuth, async (req, res, next) => {
  try {
    res.json(await getPoll(req.user!.id, req.params.pollId));
  } catch (err) {
    handle(err, next, res);
  }
});

pollsRouter.post("/:pollId/vote", requireAuth, async (req, res, next) => {
  try {
    const { optionId } = castVoteSchema.parse(req.body);
    res.json(await castVote(req.user!.id, req.params.pollId, optionId));
  } catch (err) {
    handle(err, next, res);
  }
});
