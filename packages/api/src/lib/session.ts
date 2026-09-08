import type { Request, Response } from "express";
import { prisma } from "../db";
import { sha256Hex } from "./hash";
import { generateSessionToken } from "./otp";

export const SESSION_COOKIE = "mahalle_session";
const SESSION_TTL_DAYS = 30;

export async function createSession(userId: string, req: Request) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256Hex(token),
      userAgent: req.headers["user-agent"]?.slice(0, 300),
      ipHash: req.ip ? sha256Hex(req.ip) : undefined,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export async function getUserFromRequest(req: Request) {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256Hex(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date() || session.user.suspended) {
    return null;
  }

  return session.user;
}
