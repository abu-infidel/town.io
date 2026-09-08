"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/client-api";
import { MediaUploader } from "@/components/editor/MediaUploader";

export function ReelComposer({ onPosted }: { onPosted: () => void }) {
  const [open, setOpen] = useState(false);
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!mediaId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await clientFetch("/reels", { method: "POST", body: JSON.stringify({ mediaId, caption: caption || undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ارسال ناموفق بود");
      setOpen(false);
      setMediaId(null);
      setCaption("");
      onPosted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ارسال ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)} style={{ marginBottom: 16 }}>
        🎬 ریلز جدید
      </button>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      {mediaId ? (
        <div className="muted">✅ ویدیو انتخاب شد</div>
      ) : (
        <MediaUploader accept="video" label="انتخاب ویدیو" onUploaded={setMediaId} />
      )}
      <input className="input" placeholder="کپشن (اختیاری)" value={caption} onChange={(e) => setCaption(e.target.value)} />
      {error && <div style={{ color: "var(--color-danger)" }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" disabled={!mediaId || busy} onClick={submit}>
          {busy ? "..." : "انتشار"}
        </button>
        <button className="btn btn-secondary" onClick={() => setOpen(false)}>
          انصراف
        </button>
      </div>
    </div>
  );
}
