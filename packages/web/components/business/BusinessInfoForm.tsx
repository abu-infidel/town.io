"use client";

import { useState } from "react";
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABELS_FA } from "@mahalle/shared";
import { clientFetch } from "@/lib/client-api";
import { MediaUploader } from "@/components/editor/MediaUploader";
import { ResolvedImage } from "@/components/blocks/MediaResolvers";
import type { OwnedBusinessDto } from "@/lib/types";

export function BusinessInfoForm({ business, onSaved }: { business: OwnedBusinessDto; onSaved: (b: OwnedBusinessDto) => void }) {
  const [name, setName] = useState(business.name);
  const [category, setCategory] = useState(business.category);
  const [neighborhood, setNeighborhood] = useState(business.neighborhood ?? "");
  const [address, setAddress] = useState(business.address ?? "");
  const [phone, setPhone] = useState(business.phone ?? "");
  const [summary, setSummary] = useState(business.summary ?? "");
  const [instagramHandle, setInstagramHandle] = useState(business.instagramHandle ?? "");
  const [coverMediaId, setCoverMediaId] = useState(business.coverMediaId);
  const [logoMediaId, setLogoMediaId] = useState(business.logoMediaId);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      const res = await clientFetch(`/business/${business.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          category,
          neighborhood: neighborhood || undefined,
          address: address || undefined,
          phone: phone || undefined,
          summary: summary || undefined,
          instagramHandle: instagramHandle || undefined,
          coverMediaId: coverMediaId || undefined,
          logoMediaId: logoMediaId || undefined,
        }),
      });
      const updated = await res.json();
      onSaved({ ...business, ...updated });
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
      <label>
        نام کسب‌وکار
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
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
        آدرس
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>
      <label>
        تلفن
        <input className="input" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label>
        معرفی کوتاه
        <input className="input" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={200} />
      </label>
      <label>
        آیدی اینستاگرام (بدون @)
        <input className="input" dir="ltr" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} />
      </label>

      <div>
        <div className="muted" style={{ marginBottom: 6 }}>
          لوگو
        </div>
        {logoMediaId && (
          <div style={{ width: 100, marginBottom: 8 }}>
            <ResolvedImage mediaId={logoMediaId} ownerPreview />
          </div>
        )}
        <MediaUploader accept="image" label="آپلود لوگو" onUploaded={setLogoMediaId} />
      </div>

      <div>
        <div className="muted" style={{ marginBottom: 6 }}>
          تصویر کاور
        </div>
        {coverMediaId && (
          <div style={{ maxWidth: 300, marginBottom: 8 }}>
            <ResolvedImage mediaId={coverMediaId} ownerPreview />
          </div>
        )}
        <MediaUploader accept="image" label="آپلود کاور" onUploaded={setCoverMediaId} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button className="btn btn-primary" disabled={busy} onClick={save}>
          {busy ? "..." : "ذخیره تغییرات"}
        </button>
        {saved && <span style={{ color: "var(--color-brand)" }}>✓ ذخیره شد</span>}
      </div>
    </div>
  );
}
