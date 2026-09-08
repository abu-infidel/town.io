import type { MetadataRoute } from "next";

const AI_TRAINING_BOTS = ["GPTBot", "CCBot", "ClaudeBot", "anthropic-ai", "Google-Extended", "Bytespider", "Amazonbot"];

// Public/SEO surfaces (business & product pages, once built) should be
// findable by real search engines - that's the whole point of req 3.
// Known AI-training crawlers are disallowed everywhere, and everything
// behind auth is disallowed for everyone. This is a soft signal only
// (a scraper can ignore robots.txt) - the real protections are the auth
// wall, rate limiting, and moderation-gated media URLs described in the
// architecture plan (req 14).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/u/"], disallow: ["/profile", "/login", "/api/"] },
      ...AI_TRAINING_BOTS.map((agent) => ({ userAgent: agent, disallow: "/" })),
    ],
  };
}
