import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./env";
import { attachUser } from "./middleware/auth";
import { generalApiLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/routes";
import { profileRouter } from "./modules/profile/routes";
import { mediaRouter } from "./modules/media/routes";
import { postsRouter } from "./modules/posts/routes";
import { reelsRouter } from "./modules/reels/routes";
import { followsRouter } from "./modules/follows/routes";
import { dmRouter } from "./modules/dm/routes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // behind Caddy

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", `https://${env.PUBLIC_DOMAIN}`],
          mediaSrc: ["'self'", `https://${env.PUBLIC_DOMAIN}`],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          frameAncestors: ["'none'"],
        },
      },
    })
  );
  app.use(
    cors({
      origin: env.NODE_ENV === "production" ? `https://${env.PUBLIC_DOMAIN}` : true,
      credentials: true,
    })
  );
  // Liveness check on purpose does not depend on Postgres/Redis - a DB or
  // cache blip shouldn't make an orchestrator think the whole process is dead.
  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(attachUser);
  app.use(generalApiLimiter);

  app.use("/auth", authRouter);
  app.use("/profile", profileRouter);
  app.use("/media", mediaRouter);
  app.use("/posts", postsRouter);
  app.use("/reels", reelsRouter);
  app.use("/follows", followsRouter);
  app.use("/dm", dmRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
