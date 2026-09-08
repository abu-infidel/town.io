import type { ModerationInput, ModerationProvider, ModerationResult } from "./ModerationProvider";

/** Always defers to a human. Used until MODERATION_PROVIDER=claude is configured. */
export class NoopModerationProvider implements ModerationProvider {
  async review(_input: ModerationInput): Promise<ModerationResult> {
    return { verdict: "flagged", categories: [], confidence: 0 };
  }
}
