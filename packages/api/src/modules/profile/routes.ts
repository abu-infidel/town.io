import { Router } from "express";
import { z } from "zod";
import {
  blockSchema,
  careerEntrySchema,
  createPageSchema,
  profileThemeSchema,
  reorderBlocksSchema,
} from "@mahalle/shared";
import { requireAuth } from "../../middleware/auth";
import { generalApiLimiter } from "../../middleware/rateLimit";
import { ProfileError, addBlock, addCareerEntry, createPage, deleteBlock, deleteCareerEntry, deletePage, getFullProfileByUserId, getPublicProfileByHandle, renamePage, reorderBlocks, updateBlock, updateTheme } from "./service";

export const profileRouter = Router();

function handleError(err: unknown, next: (e?: unknown) => void, res: import("express").Response) {
  if (err instanceof ProfileError) return res.status(err.status).json({ error: err.message });
  next(err);
}

profileRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    res.json(await getFullProfileByUserId(req.user!.id));
  } catch (err) {
    handleError(err, next, res);
  }
});

// Public, SSR-friendly read. Deliberately excludes anything not needed for
// display (no phone number, no internal IDs beyond what the UI needs).
profileRouter.get("/handle/:handle", generalApiLimiter, async (req, res, next) => {
  try {
    const profile = await getPublicProfileByHandle(req.params.handle);
    res.json({
      userId: profile.userId,
      handle: profile.handle,
      displayName: profile.user.displayName,
      neighborhood: profile.user.neighborhood,
      template: profile.template,
      accentColor: profile.accentColor,
      coverMediaId: profile.coverMediaId,
      avatarMediaId: profile.avatarMediaId,
      instagramHandle: profile.instagramHandle,
      pages: profile.pages,
      careerEntries: profile.careerEntries,
    });
  } catch (err) {
    handleError(err, next, res);
  }
});

profileRouter.patch("/me/theme", requireAuth, async (req, res, next) => {
  try {
    const data = profileThemeSchema.partial().parse(req.body);
    res.json(await updateTheme(req.user!.id, data));
  } catch (err) {
    handleError(err, next, res);
  }
});

profileRouter.post("/me/pages", requireAuth, async (req, res, next) => {
  try {
    const { kind, title } = createPageSchema.parse(req.body);
    res.json(await createPage(req.user!.id, kind, title));
  } catch (err) {
    handleError(err, next, res);
  }
});

profileRouter.patch("/me/pages/:pageId", requireAuth, async (req, res, next) => {
  try {
    const { title } = z.object({ title: z.string().min(1).max(60) }).parse(req.body);
    res.json(await renamePage(req.user!.id, req.params.pageId, title));
  } catch (err) {
    handleError(err, next, res);
  }
});

profileRouter.delete("/me/pages/:pageId", requireAuth, async (req, res, next) => {
  try {
    await deletePage(req.user!.id, req.params.pageId);
    res.json({ ok: true });
  } catch (err) {
    handleError(err, next, res);
  }
});

profileRouter.post("/me/pages/:pageId/blocks", requireAuth, async (req, res, next) => {
  try {
    const { type, content } = blockSchema.parse(req.body);
    res.json(await addBlock(req.user!.id, req.params.pageId, type, content));
  } catch (err) {
    handleError(err, next, res);
  }
});

profileRouter.patch("/me/blocks/:blockId", requireAuth, async (req, res, next) => {
  try {
    const { content } = blockSchema.parse(req.body);
    res.json(await updateBlock(req.user!.id, req.params.blockId, content));
  } catch (err) {
    handleError(err, next, res);
  }
});

profileRouter.delete("/me/blocks/:blockId", requireAuth, async (req, res, next) => {
  try {
    await deleteBlock(req.user!.id, req.params.blockId);
    res.json({ ok: true });
  } catch (err) {
    handleError(err, next, res);
  }
});

profileRouter.post("/me/blocks/reorder", requireAuth, async (req, res, next) => {
  try {
    const { pageId, orderedBlockIds } = reorderBlocksSchema.parse(req.body);
    await reorderBlocks(req.user!.id, pageId, orderedBlockIds);
    res.json({ ok: true });
  } catch (err) {
    handleError(err, next, res);
  }
});

profileRouter.post("/me/career", requireAuth, async (req, res, next) => {
  try {
    const data = careerEntrySchema.parse(req.body);
    res.json(await addCareerEntry(req.user!.id, data));
  } catch (err) {
    handleError(err, next, res);
  }
});

profileRouter.delete("/me/career/:entryId", requireAuth, async (req, res, next) => {
  try {
    await deleteCareerEntry(req.user!.id, req.params.entryId);
    res.json({ ok: true });
  } catch (err) {
    handleError(err, next, res);
  }
});
