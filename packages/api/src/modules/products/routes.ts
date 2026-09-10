import { Router } from "express";
import { createProductSchema, updateProductSchema } from "@mahalle/shared";
import { requireAuth } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rateLimit";
import { BusinessError } from "../business/service";
import { ProductError, createProduct, deleteProduct, getPublicProduct, updateProduct } from "./service";

export const productsRouter = Router();

const createLimiter = rateLimit({ keyPrefix: "rl:product-create", points: 30, durationSec: 60 * 60 });

function handle(err: unknown, next: (e?: unknown) => void, res: import("express").Response) {
  if (err instanceof ProductError || err instanceof BusinessError) return res.status(err.status).json({ error: err.message });
  next(err);
}

productsRouter.get("/:productId", async (req, res, next) => {
  try {
    res.json(await getPublicProduct(req.params.productId));
  } catch (err) {
    handle(err, next, res);
  }
});

productsRouter.post("/business/:businessId", requireAuth, createLimiter, async (req, res, next) => {
  try {
    const data = createProductSchema.parse(req.body);
    res.json(await createProduct(req.user!.id, req.params.businessId, data));
  } catch (err) {
    handle(err, next, res);
  }
});

productsRouter.patch("/:productId", requireAuth, async (req, res, next) => {
  try {
    const data = updateProductSchema.parse(req.body);
    res.json(await updateProduct(req.user!.id, req.params.productId, data));
  } catch (err) {
    handle(err, next, res);
  }
});

productsRouter.delete("/:productId", requireAuth, async (req, res, next) => {
  try {
    await deleteProduct(req.user!.id, req.params.productId);
    res.json({ ok: true });
  } catch (err) {
    handle(err, next, res);
  }
});
