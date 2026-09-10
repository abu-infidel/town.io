import { prisma } from "../../db";
import { decideModerationStatus } from "../../lib/moderationDecision";
import { moderationProvider } from "../../providers/moderation";
import { assertOwnsMedia, getPublicMediaUrls } from "../media/service";
import { assertOwnsBusiness } from "../business/service";

export class ProductError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const VISIBLE_STATUSES = ["auto_approved", "approved"] as const;

interface ProductInput {
  name: string;
  description?: string;
  priceToman?: number;
  isOffer?: boolean;
  originalPriceToman?: number;
  mediaIds?: string[];
}

export async function createProduct(userId: string, businessId: string, data: ProductInput) {
  await assertOwnsBusiness(userId, businessId);
  await assertOwnsMedia(userId, data.mediaIds ?? []);

  const moderation = await moderationProvider.review({ kind: "text", text: `${data.name}\n${data.description ?? ""}` });
  const moderationStatus = decideModerationStatus(moderation);

  return prisma.product.create({
    data: {
      businessId,
      name: data.name,
      description: data.description,
      priceToman: data.priceToman,
      isOffer: data.isOffer ?? false,
      originalPriceToman: data.originalPriceToman,
      moderationStatus,
      moderationNote: moderation.reasoning,
      media: { create: (data.mediaIds ?? []).map((mediaId, order) => ({ mediaId, order })) },
    },
    include: { media: true },
  });
}

async function assertOwnsProduct(userId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { business: true } });
  if (!product || product.business.ownerId !== userId) throw new ProductError("دسترسی غیرمجاز", 403);
  return product;
}

export async function updateProduct(userId: string, productId: string, data: Partial<ProductInput> & { active?: boolean }) {
  await assertOwnsProduct(userId, productId);
  const { mediaIds, ...rest } = data;

  if (mediaIds) {
    await assertOwnsMedia(userId, mediaIds);
    await prisma.$transaction([
      prisma.productMedia.deleteMany({ where: { productId } }),
      prisma.productMedia.createMany({ data: mediaIds.map((mediaId, order) => ({ productId, mediaId, order })) }),
    ]);
  }

  return prisma.product.update({ where: { id: productId }, data: rest, include: { media: true } });
}

export async function deleteProduct(userId: string, productId: string) {
  await assertOwnsProduct(userId, productId);
  await prisma.product.delete({ where: { id: productId } });
}

export async function getPublicProduct(productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, active: true, moderationStatus: { in: [...VISIBLE_STATUSES] } },
    include: {
      media: { orderBy: { order: "asc" } },
      business: { select: { slug: true, name: true, moderationStatus: true } },
    },
  });
  if (!product || !VISIBLE_STATUSES.includes(product.business.moderationStatus as (typeof VISIBLE_STATUSES)[number])) {
    throw new ProductError("کالا یافت نشد", 404);
  }

  const mediaUrls = await getPublicMediaUrls(product.media.map((m) => m.mediaId));

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    priceToman: product.priceToman,
    isOffer: product.isOffer,
    originalPriceToman: product.originalPriceToman,
    media: product.media.map((m) => mediaUrls.get(m.mediaId)).filter((u): u is string => !!u),
    business: { slug: product.business.slug, name: product.business.name },
  };
}
