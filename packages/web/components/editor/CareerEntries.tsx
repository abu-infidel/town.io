"use client";

import { useState } from "react";
import type { CareerEntryDto } from "@/lib/types";

interface Props {
  entries: CareerEntryDto[];
  onAdd: (entry: {
    organization: string;
    title: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }) => Promise<void>;
  onDelete: (entryId: string) => Promise<void>;
}

const EMPTY = { organization: "", title: "", startDate: "", endDate: "", current: false, description: "" };

export function CareerEntries({ entries, onAdd, onDelete }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);

  async function submit() {
    await onAdd({
      organization: form.organization,
      title: form.title,
      startDate: form.startDate,
      endDate: form.current ? undefined : form.endDate || undefined,
      current: form.current,
      description: form.description || undefined,
    });
    setForm(EMPTY);
    setAdding(false);
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="muted" style={{ marginBottom: 8 }}>
        این بخش قابل جست‌وجو است؛ مثلاً کسی می‌تواند «معاون فناوری شهرداری» را در محله جست‌وجو کند و صفحه تو را پیدا کند.
      </div>
      {entries.map((entry) => (
        <div key={entry.id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700 }}>
                {entry.title} · {entry.organization}
              </div>
              <div className="muted">
                {entry.startDate.slice(0, 10)} — {entry.current ? "اکنون" : entry.endDate?.slice(0, 10) ?? ""}
              </div>
              {entry.description && <div>{entry.description}</div>}
            </div>
            <button className="btn btn-secondary" style={{ color: "var(--color-danger)" }} onClick={() => onDelete(entry.id)}>
              حذف
            </button>
          </div>
        </div>
      ))}

      {adding ? (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            className="input"
            placeholder="سمت شغلی (مثلاً کارشناس فناوری اطلاعات)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            className="input"
            placeholder="نام سازمان / شرکت"
            value={form.organization}
            onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="date"
              className="input"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
            <input
              type="date"
              className="input"
              value={form.endDate}
              disabled={form.current}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <label className="muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={form.current}
              onChange={(e) => setForm((f) => ({ ...f, current: e.target.checked }))}
            />
            هم‌اکنون مشغول هستم
          </label>
          <textarea
            className="input"
            rows={3}
            placeholder="توضیحات (اختیاری)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={submit} disabled={!form.title || !form.organization || !form.startDate}>
              ذخیره
            </button>
            <button className="btn btn-secondary" onClick={() => setAdding(false)}>
              انصراف
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-secondary" onClick={() => setAdding(true)}>
          + افزودن سابقه شغلی
        </button>
      )}
    </div>
  );
}
