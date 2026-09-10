"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/client-api";
import type { PollDto } from "@/lib/types";

export function PollComposer({ onCreated }: { onCreated: (poll: PollDto) => void }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateOption(index: number, value: string) {
    setOptions((opts) => opts.map((o, i) => (i === index ? value : o)));
  }

  async function submit() {
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || cleanOptions.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const res = await clientFetch("/polls", {
        method: "POST",
        body: JSON.stringify({ question: question.trim(), description: description || undefined, options: cleanOptions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ثبت ناموفق بود");
      onCreated({
        id: data.id,
        question: data.question,
        description: data.description,
        closesAt: data.closesAt,
        closed: false,
        createdAt: data.createdAt,
        viewerVotedOptionId: null,
        totalVotes: null,
        options: data.options.map((o: { id: string; text: string }) => ({ id: o.id, text: o.text, voteCount: null })),
      });
      setQuestion("");
      setDescription("");
      setOptions(["", ""]);
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
        🗳️ نظرسنجی جدید
      </button>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <input className="input" placeholder="موضوع نظرسنجی (مثلاً: نیاز به چراغ‌راهنما سر فلان خیابون)" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={200} />
      <textarea className="input" rows={2} placeholder="توضیح بیشتر (اختیاری)" value={description} onChange={(e) => setDescription(e.target.value)} />

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {options.map((opt, i) => (
          <input
            key={i}
            className="input"
            placeholder={`گزینه ${i + 1}`}
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            maxLength={120}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {options.length < 10 && (
          <button className="btn btn-secondary" onClick={() => setOptions((o) => [...o, ""])}>
            + گزینه دیگر
          </button>
        )}
        {options.length > 2 && (
          <button className="btn btn-secondary" onClick={() => setOptions((o) => o.slice(0, -1))}>
            حذف آخرین گزینه
          </button>
        )}
      </div>

      {error && <div style={{ color: "var(--color-danger)" }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" disabled={busy || !question.trim()} onClick={submit}>
          {busy ? "..." : "انتشار نظرسنجی"}
        </button>
        <button className="btn btn-secondary" onClick={() => setOpen(false)}>
          انصراف
        </button>
      </div>
    </div>
  );
}
