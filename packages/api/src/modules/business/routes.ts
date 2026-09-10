import { Router } from "express";
import { blockSchema, createBusinessSchema, createPageSchema, reorderBlocksSchema, updateBusinessSchema } from "@mahalle/shared";
import { requireAuth } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rateLimit";
import {
  BusinessError,
  addBlock,
  createBusiness,
  createPage,
  deleteBlock,
  deletePage,
  getForOwner,
  getPublicBySlug,
  listDirectory,
  listMine,
  renamePage,
  reorderBlocks,
  updateBlock,
  updateBusiness,
} from "./service";

export const businessRouter = Router();

const createLimiter = rateLimit({ keyPrefix: "rl:business-create", points: 5, durationSec: 60 * 60 });

function handle(err: unknown, next: (e?: unknown) => void, res: import("express").Response) {
  if (err instanceof BusinessError) return res.status(err.status).json({ error: err.message });
  next(err);
}

businessRouter.get("/directory", async (req, res, next) => {
  try {
    const { q, category, neighborhood, cursor, limit } = req.query;
    res.json(
      await listDirectory({
        query: typeof q === "string" ? q : undefined,
        category: typeof category === "string" ? category : undefined,
        neighborhood: typeof neighborhood === "string" ? neighborhood : undefined,
        cursor: typeof cursor === "string" ? cursor : undefined,
        limit: limit ? Number(limit) : undefined,
      })
    );
  } catch (err) {
    handle(err, next, res);
  }
});

businessRouter.get("/slug/:slug", async (req, res, next) => {
  try {
    res.json(await getPublicBySlug(req.params.slug));
  } catch (err) {
    handle(err, next, res);
  }
});

businessRouter.get("/mine", requireAuth, async (req, res, next) => {
  try {
    res.json(await listMine(req.user!.id));
  } catch (err) {
    next(err);
  }
});

businessRouter.post("/", requireAuth, createLimiter, async (req, res, next) => {
  try {
    const data = createBusinessSchema.parse(req.body);
    res.json(await createBusiness(req.user!.id, data));
  } catch (err) {
    handle(err, next, res);
  }
});

businessRouter.get("/:businessId", requireAuth, async (req, res, next) => {
  try {
    res.json(await getForOwner(req.user!.id, req.params.businessId));
  } catch (err) {
    handle(err, next, res);
  }
});

businessRouter.patch("/:businessId", requireAuth, async (req, res, next) => {
  try {
    const data = updateBusinessSchema.parse(req.body);
    res.json(await updateBusiness(req.user!.id, req.params.businessId, data));
  } catch (err) {
    handle(err, next, res);
  }
});

businessRouter.post("/:businessId/pages", requireAuth, async (req, res, next) => {
  try {
    const { title } = createPageSchema.pick({ title: true }).parse(req.body);
    res.json(await createPage(req.user!.id, req.params.businessId, title));
  } catch (err) {
    handle(err, next, res);
  }
});

businessRouter.patch("/pages/:pageId", requireAuth, async (req, res, next) => {
  try {
    const { title } = createPageSchema.pick({ title: true }).parse(req.body);
    res.json(await renamePage(req.user!.id, req.params.pageId, title));
  } catch (err) {
    handle(err, next, res);
  }
});

businessRouter.delete("/pages/:pageId", requireAuth, async (req, res, next) => {
  try {
    await deletePage(req.user!.id, req.params.pageId);
    res.json({ ok: true });
  } catch (err) {
    handle(err, next, res);
  }
});

businessRouter.post("/pages/:pageId/blocks", requireAuth, async (req, res, next) => {
  try {
    const { type, content } = blockSchema.parse(req.body);
    res.json(await addBlock(req.user!.id, req.params.pageId, type, content));
  } catch (err) {
    handle(err, next, res);
  }
});

businessRouter.patch("/blocks/:blockId", requireAuth, async (req, res, next) => {
  try {
    const { content } = blockSchema.parse(req.body);
    res.json(await updateBlock(req.user!.id, req.params.blockId, content));
  } catch (err) {
    handle(err, next, res);
  }
});

businessRouter.delete("/blocks/:blockId", requireAuth, async (req, res, next) => {
  try {
    await deleteBlock(req.user!.id, req.params.blockId);
    res.json({ ok: true });
  } catch (err) {
    handle(err, next, res);
  }
});

businessRouter.post("/pages/:pageId/blocks/reorder", requireAuth, async (req, res, next) => {
  try {
    const { orderedBlockIds } = reorderBlocksSchema.parse({ pageId: req.params.pageId, ...req.body });
    await reorderBlocks(req.user!.id, req.params.pageId, orderedBlockIds);
    res.json({ ok: true });
  } catch (err) {
    handle(err, next, res);
  }
});
