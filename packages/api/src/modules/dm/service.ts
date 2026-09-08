import { prisma } from "../../db";
import { MAX_PAGE_SIZE } from "@mahalle/shared";

export class DmError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

async function assertParticipant(userId: string, conversationId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) throw new DmError("دسترسی غیرمجاز", 403);
}

export async function getOrCreateConversation(userId: string, otherUserId: string) {
  if (userId === otherUserId) throw new DmError("نمی‌توانی به خودت پیام بدهی");

  const otherUser = await prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true } });
  if (!otherUser) throw new DmError("کاربر یافت نشد", 404);

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [{ participants: { some: { userId } } }, { participants: { some: { userId: otherUserId } } }],
    },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: { participants: { create: [{ userId }, { userId: otherUserId }] } },
  });
}

export async function listConversations(userId: string) {
  const memberships = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: { include: { user: { select: { id: true, displayName: true, profile: { select: { handle: true } } } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  return Promise.all(
    memberships.map(async (m) => {
      const other = m.conversation.participants.find((p) => p.userId !== userId)?.user ?? null;
      const lastMessage = m.conversation.messages[0] ?? null;
      const unreadCount = await prisma.directMessage.count({
        where: {
          conversationId: m.conversationId,
          senderId: { not: userId },
          createdAt: { gt: m.lastReadAt ?? new Date(0) },
        },
      });
      return {
        conversationId: m.conversationId,
        otherUser: other,
        lastMessage: lastMessage ? { text: lastMessage.text, createdAt: lastMessage.createdAt, senderId: lastMessage.senderId } : null,
        unreadCount,
      };
    })
  );
}

export async function getConversationInfo(userId: string, conversationId: string) {
  await assertParticipant(userId, conversationId);
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    include: { user: { select: { id: true, displayName: true, profile: { select: { handle: true } } } } },
  });
  const other = participants.find((p) => p.userId !== userId)?.user ?? null;
  return { conversationId, otherUser: other };
}

export async function getMessages(userId: string, conversationId: string, beforeMessageId?: string, limit = 30) {
  await assertParticipant(userId, conversationId);
  const take = Math.min(limit, MAX_PAGE_SIZE);

  const messages = await prisma.directMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(beforeMessageId ? { cursor: { id: beforeMessageId }, skip: 1 } : {}),
  });

  const hasMore = messages.length > take;
  const page = messages.slice(0, take).reverse();

  return { messages: page, nextCursor: hasMore ? messages[take - 1].id : null };
}

export async function sendMessage(userId: string, conversationId: string, text: string) {
  await assertParticipant(userId, conversationId);

  const [message] = await prisma.$transaction([
    prisma.directMessage.create({ data: { conversationId, senderId: userId, text } }),
    prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    }),
  ]);

  const otherParticipants = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { not: userId } },
    select: { userId: true },
  });

  return { message, recipientIds: otherParticipants.map((p) => p.userId) };
}

export async function markRead(userId: string, conversationId: string) {
  await assertParticipant(userId, conversationId);
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
}
