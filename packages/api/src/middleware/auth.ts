import type { NextFunction, Request, Response } from "express";
import type { User } from "@prisma/client";
import { getUserFromRequest } from "../lib/session";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/** Attaches req.user if a valid session cookie is present; never blocks the request. */
export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  req.user = (await getUserFromRequest(req)) ?? undefined;
  next();
}

/** Blocks the request unless req.user was attached. Use after attachUser. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "ورود لازم است" });
  }
  next();
}

export function requireRole(...roles: Array<"moderator" | "admin">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as "moderator" | "admin")) {
      return res.status(403).json({ error: "دسترسی غیرمجاز" });
    }
    next();
  };
}
