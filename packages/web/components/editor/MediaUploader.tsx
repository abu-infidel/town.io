"use client";

import { useRef, useState } from "react";
import { clientFetch } from "@/lib/client-api";

interface Props {
  accept: "image" | "video";
  label: string;
  onUploaded: (mediaId: string) => void;
}

export function MediaUploader({ accept, label, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await clientFetch("/media/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "بارگذاری ناموفق بود");
      onUploaded(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "بارگذاری ناموفق بود");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept === "image" ? "image/*" : "video/*"}
        onChange={handleChange}
        disabled={busy}
        style={{ display: "none" }}
        id={`upload-${label}`}
      />
      <label htmlFor={`upload-${label}`} className="btn btn-secondary" style={{ cursor: "pointer" }}>
        {busy ? "در حال بارگذاری..." : `📤 ${label}`}
      </label>
      {error && <div style={{ color: "var(--color-danger)", marginTop: 6 }}>{error}</div>}
    </div>
  );
}
