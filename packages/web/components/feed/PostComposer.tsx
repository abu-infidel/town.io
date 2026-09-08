"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/client-api";
import { MediaUploader } from "@/components/editor/MediaUploader";
import type { PostDto } from "@/lib/types";

export function PostComposer({ onPosted }: { onPosted: (post: PostDto) => void }) {
  const [text, setText] = useState("");
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await clientFetch("/posts", { method: "POST", body: JSON.stringify({ text: text.trim(), mediaIds }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ارسال ناموفق بود");
      onPosted({
        id: data.id,
        text: data.text,
        createdAt: data.createdAt,
        author: { id: "", displayName: "شما", handle: null, neighborhood: null },
        media: [],
        likeCount: 0,
        commentCount: 0,
        likedByViewer: false,
        sameNeighborhood: false,
      });
      setText("");
      setMediaIds([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ارسال ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
      <textarea
        className="input"
        rows={3}
        placeholder="چه خبر؟ هر چی دوست داری بنویس..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {mediaIds.length < 4 && (
            <MediaUploader accept="image" label="افزودن عکس" onUploaded={(id) => setMediaIds((ids) => [...ids, id])} />
          )}
          {mediaIds.length > 0 && <span className="muted">{mediaIds.length} عکس ضمیمه شد</span>}
        </div>
        <button className="btn btn-primary" onClick={submit} disabled={busy || !text.trim()}>
          {busy ? "..." : "ارسال"}
        </button>
      </div>
      {error && <div style={{ color: "var(--color-danger)" }}>{error}</div>}
    </div>
  );
}
