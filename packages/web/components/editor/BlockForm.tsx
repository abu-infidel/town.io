"use client";

import { useState } from "react";
import type { BlockType } from "@mahalle/shared";
import { MediaUploader } from "./MediaUploader";

interface Props {
  type: BlockType;
  initialContent?: Record<string, any>;
  onSubmit: (content: Record<string, any>) => void;
  onCancel: () => void;
}

export function BlockForm({ type, initialContent, onSubmit, onCancel }: Props) {
  const [content, setContent] = useState<Record<string, any>>(initialContent ?? {});

  function set(key: string, value: unknown) {
    setContent((c) => ({ ...c, [key]: value }));
  }

  function submit() {
    onSubmit(content);
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {type === "heading" && (
        <input className="input" placeholder="متن تیتر" value={content.text ?? ""} onChange={(e) => set("text", e.target.value)} />
      )}

      {type === "text" && (
        <textarea
          className="input"
          rows={5}
          placeholder="متن..."
          value={content.text ?? ""}
          onChange={(e) => set("text", e.target.value)}
        />
      )}

      {type === "image" && (
        <>
          {content.mediaId ? (
            <div className="muted">✅ تصویر انتخاب شد</div>
          ) : (
            <MediaUploader accept="image" label="انتخاب تصویر" onUploaded={(id) => set("mediaId", id)} />
          )}
          <input
            className="input"
            placeholder="زیرنویس (اختیاری)"
            value={content.caption ?? ""}
            onChange={(e) => set("caption", e.target.value)}
          />
        </>
      )}

      {type === "gallery" && (
        <>
          <MediaUploader
            accept="image"
            label="افزودن تصویر به گالری"
            onUploaded={(id) => set("mediaIds", [...(content.mediaIds ?? []), id])}
          />
          <div className="muted">{(content.mediaIds ?? []).length} تصویر اضافه شده</div>
        </>
      )}

      {type === "video" && (
        <>
          {content.mediaId ? (
            <div className="muted">✅ ویدیو انتخاب شد</div>
          ) : (
            <MediaUploader accept="video" label="انتخاب ویدیو" onUploaded={(id) => set("mediaId", id)} />
          )}
          <input
            className="input"
            placeholder="زیرنویس (اختیاری)"
            value={content.caption ?? ""}
            onChange={(e) => set("caption", e.target.value)}
          />
        </>
      )}

      {type === "quote" && (
        <>
          <textarea
            className="input"
            rows={3}
            placeholder="متن نقل قول"
            value={content.text ?? ""}
            onChange={(e) => set("text", e.target.value)}
          />
          <input
            className="input"
            placeholder="نسبت به (اختیاری)"
            value={content.attribution ?? ""}
            onChange={(e) => set("attribution", e.target.value)}
          />
        </>
      )}

      {type === "link" && (
        <>
          <input className="input" placeholder="آدرس لینک (https://...)" value={content.url ?? ""} onChange={(e) => set("url", e.target.value)} />
          <input className="input" placeholder="عنوان لینک" value={content.label ?? ""} onChange={(e) => set("label", e.target.value)} />
        </>
      )}

      {type === "achievement" && (
        <>
          <input className="input" placeholder="عنوان دستاورد" value={content.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          <input className="input" placeholder="تاریخ (اختیاری)" value={content.date ?? ""} onChange={(e) => set("date", e.target.value)} />
          <textarea
            className="input"
            rows={3}
            placeholder="توضیحات (اختیاری)"
            value={content.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </>
      )}

      {type === "timelineItem" && (
        <>
          <input className="input" placeholder="عنوان شغلی" value={content.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          <input
            className="input"
            placeholder="سازمان (اختیاری)"
            value={content.organization ?? ""}
            onChange={(e) => set("organization", e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" className="input" value={content.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} />
            <input
              type="date"
              className="input"
              value={content.endDate ?? ""}
              disabled={content.current}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </div>
          <label className="muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={!!content.current} onChange={(e) => set("current", e.target.checked)} />
            هم‌اکنون مشغول هستم
          </label>
          <textarea
            className="input"
            rows={3}
            placeholder="توضیحات (اختیاری)"
            value={content.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </>
      )}

      {type === "instagramEmbed" && (
        <input
          className="input"
          placeholder="لینک پست اینستاگرام"
          value={content.postUrl ?? ""}
          onChange={(e) => set("postUrl", e.target.value)}
        />
      )}

      {type === "divider" && <div className="muted">یک خط جداکننده اضافه می‌شود.</div>}

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={submit}>
          ذخیره
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          انصراف
        </button>
      </div>
    </div>
  );
}
