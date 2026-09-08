import type { ModerationStatus } from "@prisma/client";
import {
  MODERATION_AUTO_APPROVE_THRESHOLD,
  MODERATION_AUTO_REJECT_THRESHOLD,
  type ModerationResult,
} from "../providers/moderation";

export function decideModerationStatus(result: ModerationResult): ModerationStatus {
  if (result.verdict === "clean" && result.confidence >= MODERATION_AUTO_APPROVE_THRESHOLD) {
    return "auto_approved";
  }
  if (result.verdict === "violation" && result.confidence >= MODERATION_AUTO_REJECT_THRESHOLD) {
    return "auto_rejected";
  }
  return "needs_human_review";
}
