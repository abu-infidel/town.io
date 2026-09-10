"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/client-api";
import { MediaUploader } from "@/components/editor/MediaUploader";
import type { NewsItemDto } from "@/lib/types";

export function NewsComposer({ onPosted }: { onPosted: (item: NewsItemDto) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await clientFetch("/news", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), body: body.trim(), coverMediaId: coverMediaId ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ارسال ناموفق بود");
      onPosted({
        id: data.id,
        title: data.title,
        body: data.body,
        createdAt: data.createdAt,
        author: { id: "", displayName: "شما" },
        coverUrl: null,
      });
      setTitle("");
      setBody("");
      setCoverMediaId(null);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ارسال ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)} style={{ marginBottom: 16 }}>
        📰 خبر جدید
      </button>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <input className="input" placeholder="عنوان خبر" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
      <textarea className="input" rows={4} placeholder="متن خبر..." value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <MediaUploader accept="image" label="افزودن عکس" onUploaded={setCoverMediaId} />
        {coverMediaId && <span className="muted">✅ عکس اضافه شد</span>}
      </div>
      {error && <div style={{ color: "var(--color-danger)" }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" disabled={busy || !title.trim() || !body.trim()} onClick={submit}>
          {busy ? "..." : "انتشار"}
        </button>
        <button className="btn btn-secondary" onClick={() => setOpen(false)}>
          انصراف
        </button>
      </div>
    </div>
  );
}
