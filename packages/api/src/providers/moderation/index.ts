import { env } from "../../env";
import type { ModerationProvider } from "./ModerationProvider";
import { NoopModerationProvider } from "./NoopModerationProvider";
import { ClaudeModerationProvider } from "./ClaudeModerationProvider";

export type * from "./ModerationProvider";

export const moderationProvider: ModerationProvider =
  env.MODERATION_PROVIDER === "claude" ? new ClaudeModerationProvider() : new NoopModerationProvider();

/** Auto-decide thresholds - tune from real moderation-queue data over time. */
export const MODERATION_AUTO_APPROVE_THRESHOLD = 0.9;
export const MODERATION_AUTO_REJECT_THRESHOLD = 0.9;
