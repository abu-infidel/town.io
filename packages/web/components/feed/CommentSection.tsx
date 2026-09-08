"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/client-api";
import type { CommentDto } from "@/lib/types";

export function CommentSection({ basePath, initialCount }: { basePath: string; initialCount: number }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<CommentDto[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(initialCount);

  async function load() {
    const res = await clientFetch(`${basePath}/comments`);
    const data = await res.json();
    setComments(data.comments);
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && comments === null) await load();
  }

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await clientFetch(`${basePath}/comments`, { method: "POST", body: JSON.stringify({ text: text.trim() }) });
      const comment = await res.json();
      setComments((c) => [...(c ?? []), comment]);
      setCount((c) => c + 1);
      setText("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="btn btn-secondary" onClick={toggle}>
        💬 {count > 0 ? count : ""} نظر
      </button>

      {open && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {comments === null && <div className="muted">در حال بارگذاری...</div>}
          {comments?.map((c) => (
            <div key={c.id} style={{ fontSize: 14 }}>
              <span style={{ fontWeight: 700 }}>{c.author.displayName}</span>{" "}
              <span className="muted">{new Date(c.createdAt).toLocaleTimeString("fa-IR")}</span>
              <div>{c.text}</div>
            </div>
          ))}
          {comments?.length === 0 && <div className="muted">هنوز نظری ثبت نشده. اولین نفر باش.</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="نظرت رو بنویس..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <button className="btn btn-primary" disabled={busy || !text.trim()} onClick={submit}>
              ارسال
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
