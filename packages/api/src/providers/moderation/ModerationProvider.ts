export type ModerationVerdict = "clean" | "flagged" | "violation";

export interface ModerationCategory {
  name: string;
  confidence: number; // 0..1
}

export interface ModerationResult {
  verdict: ModerationVerdict;
  categories: ModerationCategory[];
  confidence: number; // 0..1, overall confidence in `verdict`
  reasoning?: string;
}

export interface ModerationInput {
  kind: "text" | "image" | "video_thumbnail";
  text?: string;
  /**
   * Raw bytes read straight off local disk by the worker - deliberately not
   * a URL, so moderation works on a fully local deployment with no public
   * media endpoint and without shipping media to a third party over HTTP
   * fetch (only the direct LLM API call itself leaves the server).
   */
  image?: { buffer: Buffer; mimeType: string };
}

/**
 * Pluggable content moderation. The default (`MODERATION_PROVIDER=none`)
 * sends everything straight to the human moderation queue - safe, but
 * doesn't scale. Set MODERATION_PROVIDER=claude and ANTHROPIC_API_KEY to let
 * an LLM do the first pass: high-confidence clean content auto-publishes,
 * high-confidence violations auto-reject, and anything in between still
 * lands in front of a human. Swap in a different LLM/vendor by implementing
 * this same interface.
 */
export interface ModerationProvider {
  review(input: ModerationInput): Promise<ModerationResult>;
}
