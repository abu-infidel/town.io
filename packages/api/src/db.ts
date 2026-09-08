import { PrismaClient } from "@prisma/client";

// Single shared Prisma client instance (both the api process and the worker
// process import this file, so a `tsx watch` dev reload doesn't open a new
// connection pool every time).
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
