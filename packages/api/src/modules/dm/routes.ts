import { Router } from "express";
import { sendMessageSchema } from "@mahalle/shared";
import { requireAuth } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rateLimit";
import { emitToUser } from "../../realtime/socket";
import { DmError, getConversationInfo, getMessages, getOrCreateConversation, listConversations, markRead, sendMessage } from "./service";

export const dmRouter = Router();

const sendLimiter = rateLimit({ keyPrefix: "rl:dm-send", points: 60, durationSec: 60 });

dmRouter.get("/conversations", requireAuth, async (req, res, next) => {
  try {
    res.json(await listConversations(req.user!.id));
  } catch (err) {
    next(err);
  }
});

dmRouter.post("/conversations/with/:userId", requireAuth, async (req, res, next) => {
  try {
    const conversation = await getOrCreateConversation(req.user!.id, req.params.userId);
    res.json(conversation);
  } catch (err) {
    if (err instanceof DmError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

dmRouter.get("/conversations/:conversationId", requireAuth, async (req, res, next) => {
  try {
    res.json(await getConversationInfo(req.user!.id, req.params.conversationId));
  } catch (err) {
    if (err instanceof DmError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

dmRouter.get("/conversations/:conversationId/messages", requireAuth, async (req, res, next) => {
  try {
    const before = typeof req.query.before === "string" ? req.query.before : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    res.json(await getMessages(req.user!.id, req.params.conversationId, before, limit));
  } catch (err) {
    if (err instanceof DmError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

dmRouter.post("/conversations/:conversationId/messages", requireAuth, sendLimiter, async (req, res, next) => {
  try {
    const { text } = sendMessageSchema.parse(req.body);
    const { message, recipientIds } = await sendMessage(req.user!.id, req.params.conversationId, text);
    for (const recipientId of recipientIds) {
      emitToUser(recipientId, "dm:message", { conversationId: req.params.conversationId, message });
    }
    res.json(message);
  } catch (err) {
    if (err instanceof DmError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

dmRouter.post("/conversations/:conversationId/read", requireAuth, async (req, res, next) => {
  try {
    await markRead(req.user!.id, req.params.conversationId);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof DmError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});
