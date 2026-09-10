import { prisma } from "../../db";
import { decideModerationStatus } from "../../lib/moderationDecision";
import { moderationProvider } from "../../providers/moderation";
import { decodeCursor, encodeCursor } from "../../lib/cursor";
import { getPublicMediaUrl, getPublicMediaUrls } from "../media/service";
import { MAX_PAGE_SIZE } from "@mahalle/shared";
import type { BlockType, BusinessCategory } from "@mahalle/shared";

export class BusinessError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const VISIBLE_STATUSES = ["auto_approved", "approved"] as const;
const DIRECTORY_WINDOW = 300;

interface CreateBusinessInput {
  slug: string;
  name: string;
  category: BusinessCategory;
  neighborhood?: string;
  address?: string;
  phone?: string;
  summary?: string;
}

export async function createBusiness(ownerId: string, data: CreateBusinessInput) {
  const existing = await prisma.business.findUnique({ where: { slug: data.slug } });
  if (existing) throw new BusinessError("این آدرس قبلاً استفاده شده، یکی دیگر انتخاب کن");

  const moderation = await moderationProvider.review({ kind: "text", text: `${data.name}\n${data.summary ?? ""}` });
  const moderationStatus = decideModerationStatus(moderation);

  return prisma.business.create({
    data: {
      ownerId,
      ...data,
      moderationStatus,
      moderationNote: moderation.reasoning,
      pages: { create: [{ title: "درباره کسب‌وکار", order: 0 }] },
    },
    include: { pages: true },
  });
}

async function assertOwns(userId: string, businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business || business.ownerId !== userId) throw new BusinessError("دسترسی غیرمجاز", 403);
  return business;
}

export async function listMine(userId: string) {
  return prisma.business.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "desc" } });
}

export async function getForOwner(userId: string, businessId: string) {
  await assertOwns(userId, businessId);
  return prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    include: {
      pages: { orderBy: { order: "asc" }, include: { blocks: { orderBy: { order: "asc" } } } },
      products: { orderBy: { createdAt: "desc" }, include: { media: { orderBy: { order: "asc" } } } },
    },
  });
}

export async function updateBusiness(userId: string, businessId: string, data: Record<string, unknown>) {
  await assertOwns(userId, businessId);
  return prisma.business.update({ where: { id: businessId }, data });
}

async function toPublicDto(
  business: NonNullable<Awaited<ReturnType<typeof fetchPublicBusiness>>>
) {
  const [coverUrl, logoUrl] = await Promise.all([
    business.coverMediaId ? getPublicMediaUrl(business.coverMediaId) : null,
    business.logoMediaId ? getPublicMediaUrl(business.logoMediaId) : null,
  ]);

  const productMediaIds = business.products.flatMap((p) => p.media.map((m) => m.mediaId));
  const mediaUrls = await getPublicMediaUrls(productMediaIds);

  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    category: business.category,
    neighborhood: business.neighborhood,
    address: business.address,
    phone: business.phone,
    summary: business.summary,
    instagramHandle: business.instagramHandle,
    coverUrl,
    logoUrl,
    pages: business.pages,
    products: business.products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceToman: p.priceToman,
      isOffer: p.isOffer,
      originalPriceToman: p.originalPriceToman,
      media: p.media.map((m) => mediaUrls.get(m.mediaId)).filter((u): u is string => !!u),
    })),
  };
}

function fetchPublicBusiness(slug: string) {
  return prisma.business.findFirst({
    where: { slug, moderationStatus: { in: [...VISIBLE_STATUSES] } },
    include: {
      pages: { orderBy: { order: "asc" }, include: { blocks: { orderBy: { order: "asc" } } } },
      products: {
        where: { active: true, moderationStatus: { in: [...VISIBLE_STATUSES] } },
        orderBy: { createdAt: "desc" },
        include: { media: { orderBy: { order: "asc" } } },
      },
    },
  });
}

export async function getPublicBySlug(slug: string) {
  const business = await fetchPublicBusiness(slug);
  if (!business) throw new BusinessError("کسب‌وکار یافت نشد", 404);
  return toPublicDto(business);
}

export async function listDirectory(opts: { query?: string; category?: string; neighborhood?: string; cursor?: string; limit?: number }) {
  const take = Math.min(opts.limit ?? 20, MAX_PAGE_SIZE);
  const offset = decodeCursor(opts.cursor);

  const businesses = await prisma.business.findMany({
    where: {
      moderationStatus: { in: [...VISIBLE_STATUSES] },
      ...(opts.category ? { category: opts.category } : {}),
      ...(opts.neighborhood ? { neighborhood: opts.neighborhood } : {}),
      ...(opts.query ? { OR: [{ name: { contains: opts.query, mode: "insensitive" } }, { summary: { contains: opts.query, mode: "insensitive" } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: DIRECTORY_WINDOW,
  });

  const page = businesses.slice(offset, offset + take);
  const logoIds = page.map((b) => b.logoMediaId).filter((id): id is string => !!id);
  const logoUrls = await getPublicMediaUrls(logoIds);

  const dtos = page.map((b) => ({
    slug: b.slug,
    name: b.name,
    category: b.category,
    neighborhood: b.neighborhood,
    summary: b.summary,
    logoUrl: b.logoMediaId ? (logoUrls.get(b.logoMediaId) ?? null) : null,
  }));

  return { businesses: dtos, nextCursor: offset + take < businesses.length ? encodeCursor(offset + take) : null };
}

// --- Pages & blocks (mirrors packages/api/src/modules/profile/service.ts) ---

export async function createPage(userId: string, businessId: string, title: string) {
  await assertOwns(userId, businessId);
  const maxOrder = await prisma.businessPage.aggregate({ where: { businessId }, _max: { order: true } });
  return prisma.businessPage.create({ data: { businessId, title, order: (maxOrder._max.order ?? -1) + 1 } });
}

async function assertOwnsPage(userId: string, pageId: string) {
  const page = await prisma.businessPage.findUnique({ where: { id: pageId }, include: { business: true } });
  if (!page || page.business.ownerId !== userId) throw new BusinessError("دسترسی غیرمجاز به این صفحه", 403);
  return page;
}

export async function renamePage(userId: string, pageId: string, title: string) {
  await assertOwnsPage(userId, pageId);
  return prisma.businessPage.update({ where: { id: pageId }, data: { title } });
}

export async function deletePage(userId: string, pageId: string) {
  await assertOwnsPage(userId, pageId);
  await prisma.businessPage.delete({ where: { id: pageId } });
}

export async function addBlock(userId: string, pageId: string, type: BlockType, content: unknown) {
  await assertOwnsPage(userId, pageId);
  const maxOrder = await prisma.businessBlock.aggregate({ where: { pageId }, _max: { order: true } });
  return prisma.businessBlock.create({
    data: { pageId, type, content: content as object, order: (maxOrder._max.order ?? -1) + 1 },
  });
}

async function assertOwnsBlock(userId: string, blockId: string) {
  const block = await prisma.businessBlock.findUnique({ where: { id: blockId }, include: { page: { include: { business: true } } } });
  if (!block || block.page.business.ownerId !== userId) throw new BusinessError("دسترسی غیرمجاز", 403);
  return block;
}

export async function updateBlock(userId: string, blockId: string, content: unknown) {
  await assertOwnsBlock(userId, blockId);
  return prisma.businessBlock.update({ where: { id: blockId }, data: { content: content as object } });
}

export async function deleteBlock(userId: string, blockId: string) {
  await assertOwnsBlock(userId, blockId);
  await prisma.businessBlock.delete({ where: { id: blockId } });
}

export async function reorderBlocks(userId: string, pageId: string, orderedBlockIds: string[]) {
  await assertOwnsPage(userId, pageId);
  await prisma.$transaction(orderedBlockIds.map((id, index) => prisma.businessBlock.update({ where: { id, pageId }, data: { order: index } })));
}

export { assertOwns as assertOwnsBusiness };
