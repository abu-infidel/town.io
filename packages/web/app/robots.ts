import type { MetadataRoute } from "next";

const AI_TRAINING_BOTS = ["GPTBot", "CCBot", "ClaudeBot", "anthropic-ai", "Google-Extended", "Bytespider", "Amazonbot"];

// Default-deny: only the deliberate public/SEO surface (the business
// directory, business & product pages, and a poll's public results page -
// req 3, 23) is allowed. Everything else - every authenticated tab,
// including ones added in later phases - falls under the blanket disallow
// below without this file needing an update each time a new tab ships
// (an earlier allow-list version of this rule quietly missed /feed,
// /reels, /messages, /news, /events and /polls for exactly that reason).
//
// Personal profiles (/u/) are deliberately NOT in the indexed surface -
// req 3 only asks for businesses to be searchable, and indexing residents'
// personal pages on the open web would cut against req 14's closed,
// town-only posture. A profile link still opens fine if someone shares it
// directly; it's just never crawled or submitted for indexing.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
        allow: ["/$", "/businesses", "/biz/", "/polls/", "/robots.txt", "/sitemap.xml"],
      },
      ...AI_TRAINING_BOTS.map((agent) => ({ userAgent: agent, disallow: "/" })),
    ],
  };
}
