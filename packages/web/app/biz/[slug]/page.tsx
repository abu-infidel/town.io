import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS_CATEGORY_LABELS_FA } from "@mahalle/shared";
import { serverFetch } from "@/lib/server-api";
import type { PublicBusinessDto } from "@/lib/types";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";

async function loadBusiness(slug: string): Promise<PublicBusinessDto | null> {
  try {
    const res = await serverFetch(`/business/slug/${slug}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const business = await loadBusiness(params.slug);
  if (!business) return {};
  return {
    title: `${business.name} | محله`,
    description: business.summary ?? `${business.name} - ${BUSINESS_CATEGORY_LABELS_FA[business.category]} در محله`,
  };
}

export default async function BusinessPage({ params }: { params: { slug: string } }) {
  const business = await loadBusiness(params.slug);
  if (!business) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.summary ?? undefined,
    image: business.coverUrl ?? business.logoUrl ?? undefined,
    address: business.address
      ? { "@type": "PostalAddress", streetAddress: business.address, addressLocality: business.neighborhood ?? undefined }
      : undefined,
    telephone: business.phone ?? undefined,
  };

  return (
    <div className="container" style={{ paddingTop: 0, paddingBottom: 56 }}>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {business.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={business.coverUrl} alt="" style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: "var(--radius-lg)", margin: "24px 0" }} />
      )}

      <div className="card" style={{ marginBottom: 24, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        {business.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.logoUrl} alt="" style={{ width: 72, height: 72, borderRadius: "var(--radius-md)", objectFit: "cover" }} />
        )}
        <div>
          <h1 style={{ fontSize: 26 }}>{business.name}</h1>
          <div className="muted">{BUSINESS_CATEGORY_LABELS_FA[business.category]}</div>
          {business.neighborhood && <div className="muted">📍 {business.neighborhood}</div>}
          {business.address && <div className="muted">{business.address}</div>}
          {business.phone && (
            <a href={`tel:${business.phone}`} className="btn btn-secondary" style={{ marginTop: 8 }}>
              ☎️ {business.phone}
            </a>
          )}
          {business.instagramHandle && (
            <a
              href={`https://instagram.com/${business.instagramHandle}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ marginTop: 8, marginInlineStart: 8 }}
            >
              📷 اینستاگرام
            </a>
          )}
        </div>
      </div>

      {business.products.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, color: "var(--color-text-muted)", marginBottom: 12 }}>محصولات و خدمات</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {business.products.map((p) => (
              <Link key={p.id} href={`/biz/${business.slug}/product/${p.id}`} className="card">
                {p.media[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.media[0]} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "var(--radius-md)", marginBottom: 8 }} />
                )}
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                {p.isOffer && <span style={{ color: "var(--color-brand)" }}>🏷️ تخفیف ویژه</span>}
                {p.priceToman != null && <div>{p.priceToman.toLocaleString("fa-IR")} تومان</div>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {business.pages.map((page) => (
        <section key={page.id} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, color: "var(--color-text-muted)", marginBottom: 12 }}>{page.title}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {page.blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
            {page.blocks.length === 0 && <div className="muted">هنوز محتوایی اضافه نشده است.</div>}
          </div>
        </section>
      ))}
    </div>
  );
}
