"use client";

import { useState } from "react";
import type { ProfileTemplate } from "@mahalle/shared";
import { PROFILE_TEMPLATES } from "@mahalle/shared";
import { MediaUploader } from "./MediaUploader";

const TEMPLATE_LABELS: Record<ProfileTemplate, { title: string; desc: string }> = {
  classic: { title: "کلاسیک", desc: "ساده و خوانا، تمرکز روی محتوا" },
  cardStack: { title: "کارتی", desc: "هر بخش در قالب کارت جداگانه" },
  magazine: { title: "مجله‌ای", desc: "چیدمان بزرگ‌تر و چشم‌نوازتر" },
};

interface Props {
  template: ProfileTemplate;
  accentColor: string;
  instagramHandle: string | null;
  avatarMediaId: string | null;
  coverMediaId: string | null;
  onSave: (data: {
    template: ProfileTemplate;
    accentColor: string;
    instagramHandle?: string;
    avatarMediaId?: string;
    coverMediaId?: string;
  }) => Promise<void>;
}

export function ThemeEditor(props: Props) {
  const [template, setTemplate] = useState(props.template);
  const [accentColor, setAccentColor] = useState(props.accentColor);
  const [instagramHandle, setInstagramHandle] = useState(props.instagramHandle ?? "");
  const [avatarMediaId, setAvatarMediaId] = useState(props.avatarMediaId ?? undefined);
  const [coverMediaId, setCoverMediaId] = useState(props.coverMediaId ?? undefined);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await props.onSave({ template, accentColor, instagramHandle, avatarMediaId, coverMediaId });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div className="muted" style={{ marginBottom: 8 }}>
          قالب صفحه
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {PROFILE_TEMPLATES.map((t) => (
            <button
              key={t}
              onClick={() => setTemplate(t)}
              className={template === t ? "btn btn-primary" : "btn btn-secondary"}
              style={{ flexDirection: "column", height: "auto", padding: "10px 16px" }}
            >
              <div>{TEMPLATE_LABELS[t].title}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{TEMPLATE_LABELS[t].desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <label className="muted" htmlFor="accent">
          رنگ اصلی صفحه
        </label>
        <input id="accent" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <MediaUploader accept="image" label="تصویر پروفایل" onUploaded={setAvatarMediaId} />
        <MediaUploader accept="image" label="کاور صفحه" onUploaded={setCoverMediaId} />
      </div>

      <div>
        <label className="muted" htmlFor="ig">
          آیدی اینستاگرام (اختیاری - بدون @)
        </label>
        <input
          id="ig"
          className="input"
          placeholder="mytown.page"
          value={instagramHandle}
          onChange={(e) => setInstagramHandle(e.target.value)}
        />
      </div>

      <button className="btn btn-primary" onClick={save} disabled={saving} style={{ alignSelf: "flex-start" }}>
        {saving ? "در حال ذخیره..." : "ذخیره ظاهر صفحه"}
      </button>
    </div>
  );
}
