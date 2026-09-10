import { Router } from "express";
import { createCommentSchema, createEventPostSchema, createEventSchema, paginationSchema } from "@mahalle/shared";
import { requireAuth } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rateLimit";
import { MediaError } from "../media/service";
import { addComment, deleteComment, listComments } from "../comments/service";
import {
  EventError,
  createEvent,
  createEventPost,
  deleteEvent,
  deleteEventPost,
  getEvent,
  listEventPosts,
  listEvents,
  toggleEventPostLike,
  toggleRsvp,
} from "./service";

export const eventsRouter = Router();

const createLimiter = rateLimit({ keyPrefix: "rl:event-create", points: 10, durationSec: 60 * 60 });
const createPostLimiter = rateLimit({ keyPrefix: "rl:event-post-create", points: 30, durationSec: 60 * 60 });

function handle(err: unknown, next: (e?: unknown) => void, res: import("express").Response) {
  if (err instanceof EventError || err instanceof MediaError) return res.status(err.status).json({ error: err.message });
  next(err);
}

eventsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { cursor, limit } = paginationSchema.parse(req.query);
    const when = req.query.when === "past" ? "past" : "upcoming";
    res.json(await listEvents(req.user!.id, when, cursor, limit));
  } catch (err) {
    handle(err, next, res);
  }
});

eventsRouter.post("/", requireAuth, createLimiter, async (req, res, next) => {
  try {
    const data = createEventSchema.parse(req.body);
    res.json(await createEvent(req.user!.id, data));
  } catch (err) {
    handle(err, next, res);
  }
});

eventsRouter.get("/:eventId", requireAuth, async (req, res, next) => {
  try {
    res.json(await getEvent(req.user!.id, req.params.eventId));
  } catch (err) {
    handle(err, next, res);
  }
});

eventsRouter.delete("/:eventId", requireAuth, async (req, res, next) => {
  try {
    await deleteEvent(req.user!.id, req.params.eventId);
    res.json({ ok: true });
  } catch (err) {
    handle(err, next, res);
  }
});

eventsRouter.post("/:eventId/rsvp", requireAuth, async (req, res, next) => {
  try {
    res.json(await toggleRsvp(req.user!.id, req.params.eventId));
  } catch (err) {
    handle(err, next, res);
  }
});

eventsRouter.get("/:eventId/posts", requireAuth, async (req, res, next) => {
  try {
    const { cursor, limit } = paginationSchema.parse(req.query);
    res.json(await listEventPosts(req.user!.id, req.params.eventId, cursor, limit));
  } catch (err) {
    handle(err, next, res);
  }
});

eventsRouter.post("/:eventId/posts", requireAuth, createPostLimiter, async (req, res, next) => {
  try {
    const { text, mediaIds } = createEventPostSchema.parse(req.body);
    res.json(await createEventPost(req.user!.id, req.params.eventId, text, mediaIds));
  } catch (err) {
    handle(err, next, res);
  }
});

eventsRouter.delete("/posts/:eventPostId", requireAuth, async (req, res, next) => {
  try {
    await deleteEventPost(req.user!.id, req.params.eventPostId);
    res.json({ ok: true });
  } catch (err) {
    handle(err, next, res);
  }
});

eventsRouter.post("/posts/:eventPostId/like", requireAuth, async (req, res, next) => {
  try {
    res.json(await toggleEventPostLike(req.user!.id, req.params.eventPostId));
  } catch (err) {
    handle(err, next, res);
  }
});

eventsRouter.get("/posts/:eventPostId/comments", requireAuth, async (req, res, next) => {
  try {
    const { cursor, limit } = paginationSchema.parse(req.query);
    res.json(await listComments({ eventPostId: req.params.eventPostId }, cursor, limit));
  } catch (err) {
    next(err);
  }
});

eventsRouter.post("/posts/:eventPostId/comments", requireAuth, async (req, res, next) => {
  try {
    const { text } = createCommentSchema.parse(req.body);
    res.json(await addComment(req.user!.id, { eventPostId: req.params.eventPostId }, text));
  } catch (err) {
    next(err);
  }
});

eventsRouter.delete("/comments/:commentId", requireAuth, async (req, res, next) => {
  try {
    await deleteComment(req.user!.id, req.params.commentId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
