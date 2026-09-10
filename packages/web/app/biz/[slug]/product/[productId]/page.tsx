import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { serverFetch } from "@/lib/server-api";
import type { PublicProductDetailDto } from "@/lib/types";

async function loadProduct(productId: string): Promise<PublicProductDetailDto | null> {
  try {
    const res = await serverFetch(`/products/${productId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { productId: string } }): Promise<Metadata> {
  const product = await loadProduct(params.productId);
  if (!product) return {};
  return {
    title: `${product.name} | ${product.business.name} | محله`,
    description: product.description ?? `${product.name} از ${product.business.name}`,
  };
}

export default async function ProductPage({ params }: { params: { slug: string; productId: string } }) {
  const product = await loadProduct(params.productId);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.media[0] ?? undefined,
    offers:
      product.priceToman != null
        ? {
            "@type": "Offer",
            priceCurrency: "IRR",
            price: product.priceToman * 10, // toman -> rial, the currency schema.org/Google expects
            availability: "https://schema.org/InStock",
          }
        : undefined,
  };

  return (
    <div className="container" style={{ maxWidth: 640, paddingTop: 24, paddingBottom: 56 }}>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href={`/biz/${params.slug}`} className="muted">
        ← {product.business.name}
      </Link>

      <div className="card" style={{ marginTop: 12 }}>
        {product.media.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: product.media.length === 1 ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {product.media.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" style={{ width: "100%", borderRadius: "var(--radius-md)" }} />
            ))}
          </div>
        )}

        <h1 style={{ fontSize: 24, marginBottom: 8 }}>{product.name}</h1>
        {product.isOffer && <span style={{ color: "var(--color-brand)" }}>🏷️ تخفیف ویژه</span>}

        {product.priceToman != null && (
          <div style={{ fontSize: 20, margin: "8px 0" }}>
            {product.isOffer && product.originalPriceToman != null && (
              <span className="muted" style={{ textDecoration: "line-through", marginInlineEnd: 8 }}>
                {product.originalPriceToman.toLocaleString("fa-IR")}
              </span>
            )}
            {product.priceToman.toLocaleString("fa-IR")} تومان
          </div>
        )}

        {product.description && <p style={{ whiteSpace: "pre-wrap" }}>{product.description}</p>}
      </div>
    </div>
  );
}
