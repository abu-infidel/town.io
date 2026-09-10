"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/client-api";
import { MediaUploader } from "@/components/editor/MediaUploader";
import { ResolvedImage } from "@/components/blocks/MediaResolvers";
import type { OwnedProductDto } from "@/lib/types";

function ProductForm({ onSubmit, onCancel }: { onSubmit: (data: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceToman, setPriceToman] = useState("");
  const [isOffer, setIsOffer] = useState(false);
  const [originalPriceToman, setOriginalPriceToman] = useState("");
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description || undefined,
        priceToman: priceToman ? Number(priceToman) : undefined,
        isOffer,
        originalPriceToman: isOffer && originalPriceToman ? Number(originalPriceToman) : undefined,
        mediaIds,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input className="input" placeholder="نام کالا یا خدمت" value={name} onChange={(e) => setName(e.target.value)} />
      <textarea className="input" placeholder="توضیحات" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="input"
          type="number"
          placeholder="قیمت (تومان، اختیاری)"
          value={priceToman}
          onChange={(e) => setPriceToman(e.target.value)}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={isOffer} onChange={(e) => setIsOffer(e.target.checked)} />
          تخفیف ویژه
        </label>
      </div>
      {isOffer && (
        <input
          className="input"
          type="number"
          placeholder="قیمت قبل از تخفیف"
          value={originalPriceToman}
          onChange={(e) => setOriginalPriceToman(e.target.value)}
        />
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {mediaIds.length < 6 && <MediaUploader accept="image" label="افزودن عکس" onUploaded={(id) => setMediaIds((ids) => [...ids, id])} />}
        {mediaIds.length > 0 && <span className="muted">{mediaIds.length} عکس</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" disabled={busy || !name.trim()} onClick={submit}>
          {busy ? "..." : "ذخیره"}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          انصراف
        </button>
      </div>
    </div>
  );
}

export function ProductManager({ businessId, initialProducts }: { businessId: string; initialProducts: OwnedProductDto[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [adding, setAdding] = useState(false);

  async function addProduct(data: Record<string, unknown>) {
    const res = await clientFetch(`/products/business/${businessId}`, { method: "POST", body: JSON.stringify(data) });
    const product = await res.json();
    setProducts((p) => [product, ...p]);
    setAdding(false);
  }

  async function toggleActive(product: OwnedProductDto) {
    const res = await clientFetch(`/products/${product.id}`, { method: "PATCH", body: JSON.stringify({ active: !product.active }) });
    const updated = await res.json();
    setProducts((p) => p.map((x) => (x.id === product.id ? updated : x)));
  }

  async function remove(productId: string) {
    if (!confirm("این کالا حذف شود؟")) return;
    await clientFetch(`/products/${productId}`, { method: "DELETE" });
    setProducts((p) => p.filter((x) => x.id !== productId));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {products.map((product) => (
        <div key={product.id} className="card" style={{ opacity: product.active ? 1 : 0.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700 }}>{product.name}</div>
            {product.isOffer && <span style={{ color: "var(--color-brand)" }}>🏷️ تخفیف ویژه</span>}
          </div>
          {product.description && <p className="muted">{product.description}</p>}
          {product.priceToman != null && (
            <div>
              {product.isOffer && product.originalPriceToman != null && (
                <span className="muted" style={{ textDecoration: "line-through", marginInlineEnd: 8 }}>
                  {product.originalPriceToman.toLocaleString("fa-IR")}
                </span>
              )}
              {product.priceToman.toLocaleString("fa-IR")} تومان
            </div>
          )}
          {product.media.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {product.media.map((m) => (
                <div key={m.id} style={{ width: 80 }}>
                  <ResolvedImage mediaId={m.mediaId} ownerPreview />
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 10, borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>
            <button className="btn btn-secondary" onClick={() => toggleActive(product)}>
              {product.active ? "پنهان کردن" : "نمایش دوباره"}
            </button>
            <button className="btn btn-secondary" style={{ color: "var(--color-danger)" }} onClick={() => remove(product.id)}>
              حذف
            </button>
          </div>
        </div>
      ))}

      {adding ? (
        <ProductForm onSubmit={addProduct} onCancel={() => setAdding(false)} />
      ) : (
        <button className="btn btn-secondary" onClick={() => setAdding(true)}>
          + کالا یا خدمت جدید
        </button>
      )}
    </div>
  );
}
