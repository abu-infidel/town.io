"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABELS_FA } from "@mahalle/shared";
import { clientFetch } from "@/lib/client-api";

export function CreateBusinessForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<(typeof BUSINESS_CATEGORIES)[number]>("other");
  const [neighborhood, setNeighborhood] = useState("");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await clientFetch("/business", {
        method: "POST",
        body: JSON.stringify({ slug, name, category, neighborhood: neighborhood || undefined, summary: summary || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ثبت ناموفق بود");
      router.push(`/business/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ثبت ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        🏪 ثبت کسب‌وکار جدید
      </button>
    );
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 480 }}>
      <label>
        نام کسب‌وکار
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً نانوایی سرمحله" />
      </label>
      <label>
        آدرس صفحه (انگلیسی، بدون فاصله)
        <input
          className="input"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="nanvaei-sar-mahalle"
          dir="ltr"
        />
      </label>
      <label>
        دسته‌بندی
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
          {BUSINESS_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {BUSINESS_CATEGORY_LABELS_FA[c]}
            </option>
          ))}
        </select>
      </label>
      <label>
        محله
        <input className="input" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
      </label>
      <label>
        معرفی کوتاه (یک خط)
        <input className="input" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={200} />
      </label>
      {error && <div style={{ color: "var(--color-danger)" }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" disabled={busy || !name || !slug} onClick={submit}>
          {busy ? "..." : "ثبت"}
        </button>
        <button className="btn btn-secondary" onClick={() => setOpen(false)}>
          انصراف
        </button>
      </div>
    </div>
  );
}
