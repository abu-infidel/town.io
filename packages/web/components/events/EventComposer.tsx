"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/client-api";
import { MediaUploader } from "@/components/editor/MediaUploader";
import type { EventListItemDto } from "@/lib/types";

export function EventComposer({ onCreated }: { onCreated: (event: EventListItemDto) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState("");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim() || !description.trim() || !startAt) return;
    setBusy(true);
    setError(null);
    try {
      const res = await clientFetch("/events", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: location || undefined,
          startAt: new Date(startAt).toISOString(),
          coverMediaId: coverMediaId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ثبت ناموفق بود");
      onCreated({
        id: data.id,
        title: data.title,
        description: data.description,
        location: data.location,
        startAt: data.startAt,
        endAt: data.endAt,
        creator: { id: "", displayName: "شما" },
        coverUrl: null,
        rsvpCount: 0,
      });
      setTitle("");
      setDescription("");
      setLocation("");
      setStartAt("");
      setCoverMediaId(null);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ثبت ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)} style={{ marginBottom: 16 }}>
        🎉 رویداد جدید
      </button>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <input className="input" placeholder="عنوان رویداد" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
      <textarea className="input" rows={3} placeholder="توضیحات رویداد..." value={description} onChange={(e) => setDescription(e.target.value)} />
      <input className="input" placeholder="مکان (اختیاری)" value={location} onChange={(e) => setLocation(e.target.value)} />
      <label>
        زمان شروع
        <input className="input" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
      </label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <MediaUploader accept="image" label="افزودن عکس" onUploaded={setCoverMediaId} />
        {coverMediaId && <span className="muted">✅ عکس اضافه شد</span>}
      </div>
      {error && <div style={{ color: "var(--color-danger)" }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" disabled={busy || !title.trim() || !description.trim() || !startAt} onClick={submit}>
          {busy ? "..." : "ثبت رویداد"}
        </button>
        <button className="btn btn-secondary" onClick={() => setOpen(false)}>
          انصراف
        </button>
      </div>
    </div>
  );
}
