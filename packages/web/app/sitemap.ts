import type { MetadataRoute } from "next";
import { publicFetch } from "@/lib/server-api";
import type { DirectoryBusinessDto, PublicBusinessDto } from "@/lib/types";

// Only the deliberate public/SEO surface goes in the sitemap (req 3) -
// personal profiles are crawlable if directly linked (see robots.ts) but are
// never proactively submitted for indexing.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const domain = process.env.PUBLIC_DOMAIN ?? "localhost";
  const base = `https://${domain}`;

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/businesses`, changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const res = await publicFetch("/business/directory?limit=30");
    if (!res.ok) return entries;
    const { businesses } = (await res.json()) as { businesses: DirectoryBusinessDto[] };

    for (const b of businesses) {
      entries.push({ url: `${base}/biz/${b.slug}`, changeFrequency: "weekly", priority: 0.8 });

      try {
        const detailRes = await publicFetch(`/business/slug/${b.slug}`);
        if (!detailRes.ok) continue;
        const detail = (await detailRes.json()) as PublicBusinessDto;
        for (const p of detail.products) {
          entries.push({ url: `${base}/biz/${b.slug}/product/${p.id}`, changeFrequency: "weekly", priority: 0.6 });
        }
      } catch {
        // one business's product lookup failing shouldn't drop the rest of the sitemap
      }
    }
  } catch {
    // api unreachable - still return the static entries rather than a 500
  }

  return entries;
}
