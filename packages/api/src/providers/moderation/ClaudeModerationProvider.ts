import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../env";
import type { ModerationInput, ModerationProvider, ModerationResult, ModerationVerdict } from "./ModerationProvider";

const SYSTEM_PROMPT = `You are a content moderation assistant for a small local town's community platform.
The community guidelines: no nudity/sexual content, no graphic violence, no hate speech or harassment,
no doxxing/private info about others, no illegal-activity promotion, no spam/scams.
Judge the given content and respond with ONLY a JSON object, no prose, matching:
{"verdict": "clean" | "flagged" | "violation", "categories": [{"name": string, "confidence": number}], "confidence": number, "reasoning": string}
"confidence" is your overall confidence (0..1) in the verdict. Use "flagged" whenever you are unsure -
a human moderator reviews anything that isn't a high-confidence "clean" or high-confidence "violation".`;

export class ClaudeModerationProvider implements ModerationProvider {
  private client: Anthropic;

  constructor() {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async review(input: ModerationInput): Promise<ModerationResult> {
    const content: Anthropic.MessageParam["content"] = [];

    if (input.text) {
      content.push({ type: "text", text: `Text content to review:\n"""${input.text}"""` });
    }

    if (input.image) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: input.image.mimeType as "image/jpeg",
          data: input.image.buffer.toString("base64"),
        },
      });
    }

    const message = await this.client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { verdict: "flagged", categories: [], confidence: 0, reasoning: "no model output" };
    }

    return this.parseResult(textBlock.text);
  }

  private parseResult(raw: string): ModerationResult {
    try {
      const jsonText = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      const parsed = JSON.parse(jsonText) as {
        verdict: ModerationVerdict;
        categories: { name: string; confidence: number }[];
        confidence: number;
        reasoning?: string;
      };
      return {
        verdict: parsed.verdict,
        categories: parsed.categories ?? [],
        confidence: parsed.confidence ?? 0,
        reasoning: parsed.reasoning,
      };
    } catch {
      return { verdict: "flagged", categories: [], confidence: 0, reasoning: "unparseable model output" };
    }
  }
}
