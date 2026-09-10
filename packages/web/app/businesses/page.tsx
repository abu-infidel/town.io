import Link from "next/link";
import type { Metadata } from "next";
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABELS_FA } from "@mahalle/shared";
import { serverFetch } from "@/lib/server-api";
import type { DirectoryBusinessDto } from "@/lib/types";

export const metadata: Metadata = {
  title: "کسب‌وکارهای محله | محله",
  description: "فهرست مغازه‌ها و خدمات محلی، همراه با محصولات و تخفیف‌هاشون.",
};

async function loadDirectory(q?: string, category?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  try {
    const res = await serverFetch(`/business/directory?${params.toString()}`);
    if (!res.ok) return { businesses: [] as DirectoryBusinessDto[] };
    return (await res.json()) as { businesses: DirectoryBusinessDto[] };
  } catch {
    return { businesses: [] as DirectoryBusinessDto[] };
  }
}

export default async function BusinessDirectoryPage({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const { businesses } = await loadDirectory(searchParams.q, searchParams.category);

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 56 }}>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>کسب‌وکارهای محله</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        مغازه‌ها و خدمات محلی؛ نمایش محصولات و تخفیف‌ها برای همه رایگان و آزاده.{" "}
        <Link href="/business" style={{ textDecoration: "underline" }}>
          کسب‌وکارت رو ثبت کن
        </Link>
      </p>

      <form style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <input className="input" name="q" defaultValue={searchParams.q} placeholder="جستجوی نام یا معرفی..." style={{ flex: 1, minWidth: 200 }} />
        <select className="input" name="category" defaultValue={searchParams.category ?? ""} style={{ maxWidth: 200 }}>
          <option value="">همه دسته‌ها</option>
          {BUSINESS_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {BUSINESS_CATEGORY_LABELS_FA[c]}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit">
          جستجو
        </button>
      </form>

      {businesses.length === 0 && <div className="muted">کسب‌وکاری پیدا نشد.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {businesses.map((b) => (
          <Link key={b.slug} href={`/biz/${b.slug}`} className="card">
            {b.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.logoUrl} alt="" style={{ width: 56, height: 56, borderRadius: "var(--radius-md)", objectFit: "cover", marginBottom: 10 }} />
            )}
            <div style={{ fontWeight: 700 }}>{b.name}</div>
            <div className="muted">{BUSINESS_CATEGORY_LABELS_FA[b.category]}</div>
            {b.neighborhood && <div className="muted">📍 {b.neighborhood}</div>}
            {b.summary && <p style={{ marginTop: 6 }}>{b.summary}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
