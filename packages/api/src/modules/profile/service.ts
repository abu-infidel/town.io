import { prisma } from "../../db";
import type { BlockType, PageKind, ProfileTemplate } from "@mahalle/shared";

export class ProfileError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function getFullProfileByUserId(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      pages: { orderBy: { order: "asc" }, include: { blocks: { orderBy: { order: "asc" } } } },
      careerEntries: { orderBy: { startDate: "desc" } },
    },
  });
  if (!profile) throw new ProfileError("پروفایل یافت نشد", 404);
  return profile;
}

export async function getPublicProfileByHandle(handle: string) {
  const profile = await prisma.profile.findUnique({
    where: { handle },
    include: {
      user: { select: { displayName: true, neighborhood: true } },
      pages: { orderBy: { order: "asc" }, include: { blocks: { orderBy: { order: "asc" } } } },
      careerEntries: { orderBy: { startDate: "desc" } },
    },
  });
  if (!profile) throw new ProfileError("صفحه یافت نشد", 404);
  return profile;
}

export async function updateTheme(
  userId: string,
  data: { template?: ProfileTemplate; accentColor?: string; coverMediaId?: string; avatarMediaId?: string; instagramHandle?: string }
) {
  return prisma.profile.update({ where: { userId }, data });
}

async function ownedProfileId(userId: string): Promise<string> {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new ProfileError("پروفایل یافت نشد", 404);
  return profile.id;
}

export async function createPage(userId: string, kind: PageKind, title: string) {
  const profileId = await ownedProfileId(userId);
  const maxOrder = await prisma.profilePage.aggregate({ where: { profileId }, _max: { order: true } });
  return prisma.profilePage.create({
    data: { profileId, kind, title, order: (maxOrder._max.order ?? -1) + 1 },
  });
}

async function assertOwnsPage(userId: string, pageId: string) {
  const page = await prisma.profilePage.findUnique({ where: { id: pageId }, include: { profile: true } });
  if (!page || page.profile.userId !== userId) throw new ProfileError("دسترسی غیرمجاز به این صفحه", 403);
  return page;
}

export async function renamePage(userId: string, pageId: string, title: string) {
  await assertOwnsPage(userId, pageId);
  return prisma.profilePage.update({ where: { id: pageId }, data: { title } });
}

export async function deletePage(userId: string, pageId: string) {
  const page = await assertOwnsPage(userId, pageId);
  if (page.kind !== "custom") {
    throw new ProfileError("صفحات اصلی (درباره من، دستاوردها، مسیر شغلی، علایق) قابل حذف نیستند");
  }
  await prisma.profilePage.delete({ where: { id: pageId } });
}

export async function addBlock(userId: string, pageId: string, type: BlockType, content: unknown) {
  await assertOwnsPage(userId, pageId);
  const maxOrder = await prisma.profileBlock.aggregate({ where: { pageId }, _max: { order: true } });
  return prisma.profileBlock.create({
    data: { pageId, type, content: content as object, order: (maxOrder._max.order ?? -1) + 1 },
  });
}

async function assertOwnsBlock(userId: string, blockId: string) {
  const block = await prisma.profileBlock.findUnique({
    where: { id: blockId },
    include: { page: { include: { profile: true } } },
  });
  if (!block || block.page.profile.userId !== userId) throw new ProfileError("دسترسی غیرمجاز", 403);
  return block;
}

export async function updateBlock(userId: string, blockId: string, content: unknown) {
  await assertOwnsBlock(userId, blockId);
  return prisma.profileBlock.update({ where: { id: blockId }, data: { content: content as object } });
}

export async function deleteBlock(userId: string, blockId: string) {
  await assertOwnsBlock(userId, blockId);
  await prisma.profileBlock.delete({ where: { id: blockId } });
}

export async function reorderBlocks(userId: string, pageId: string, orderedBlockIds: string[]) {
  await assertOwnsPage(userId, pageId);
  await prisma.$transaction(
    orderedBlockIds.map((id, index) =>
      prisma.profileBlock.update({ where: { id, pageId }, data: { order: index } })
    )
  );
}

export async function addCareerEntry(
  userId: string,
  data: { organization: string; title: string; startDate: string; endDate?: string; current: boolean; description?: string }
) {
  const profileId = await ownedProfileId(userId);
  return prisma.careerEntry.create({
    data: {
      profileId,
      organization: data.organization,
      title: data.title,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      current: data.current,
      description: data.description,
    },
  });
}

export async function deleteCareerEntry(userId: string, entryId: string) {
  const entry = await prisma.careerEntry.findUnique({ where: { id: entryId }, include: { profile: true } });
  if (!entry || entry.profile.userId !== userId) throw new ProfileError("دسترسی غیرمجاز", 403);
  await prisma.careerEntry.delete({ where: { id: entryId } });
}
