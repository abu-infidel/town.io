import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { parse as parseCookie } from "cookie";
import { prisma } from "../db";
import { env } from "../env";
import { sha256Hex } from "../lib/hash";
import { SESSION_COOKIE } from "../lib/session";

let io: SocketIOServer | null = null;

/**
 * DMs only (comments/likes stay request/response - simpler, and this is the
 * one interaction in the whole app where "someone is waiting on the other
 * end right now" actually matters). Auth reuses the same session cookie as
 * the REST API rather than a separate token scheme.
 */
export function initRealtime(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.NODE_ENV === "production" ? `https://${env.PUBLIC_DOMAIN}` : true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const raw = socket.handshake.headers.cookie;
      const token = raw ? parseCookie(raw)[SESSION_COOKIE] : undefined;
      if (!token) return next(new Error("unauthorized"));

      const session = await prisma.session.findUnique({ where: { tokenHash: sha256Hex(token) } });
      if (!session || session.expiresAt < new Date()) return next(new Error("unauthorized"));

      socket.data.userId = session.userId;
      next();
    } catch (err) {
      next(err instanceof Error ? err : new Error("auth error"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}
