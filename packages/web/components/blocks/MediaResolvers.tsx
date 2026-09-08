"use client";

import { useEffect, useState } from "react";
import { clientFetch } from "@/lib/client-api";

/**
 * Blocks only ever store a mediaId, never a URL - the URL is resolved at
 * render time so moderation status is always checked fresh (a previously
 * "pending" upload becomes visible the moment it's approved, and never
 * leaks if it's rejected). `ownerPreview` uses the authenticated status
 * endpoint (so you can preview your own not-yet-approved upload while
 * editing); public viewers always use the public, approval-gated endpoint.
 */
function useResolvedMediaUrl(mediaId: string, ownerPreview: boolean) {
  const [state, setState] = useState<{ url: string | null; pending: boolean; loading: boolean }>({
    url: null,
    pending: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        if (ownerPreview) {
          const res = await clientFetch(`/media/${mediaId}/status`);
          const data = await res.json();
          if (cancelled) return;
          setState({
            url: data.processedUrl ?? null,
            pending: data.moderationStatus === "pending" || data.moderationStatus === "needs_human_review",
            loading: false,
          });
        } else {
          const res = await fetch(`/api/media/${mediaId}/public`);
          if (!res.ok) return setState({ url: null, pending: false, loading: false });
          const data = await res.json();
          if (cancelled) return;
          setState({ url: data.url, pending: false, loading: false });
        }
      } catch {
        if (!cancelled) setState({ url: null, pending: false, loading: false });
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [mediaId, ownerPreview]);

  return state;
}

export function ResolvedImage({
  mediaId,
  ownerPreview = false,
  alt,
}: {
  mediaId: string;
  ownerPreview?: boolean;
  alt?: string;
}) {
  const { url, pending, loading } = useResolvedMediaUrl(mediaId, ownerPreview);
  if (loading) return <div className="muted">در حال بارگذاری تصویر...</div>;
  if (pending) return <div className="muted">🕓 تصویر در انتظار بررسی است (فقط برای خودت نمایش داده می‌شود)</div>;
  if (!url) return <div className="muted">تصویر در دسترس نیست</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt ?? ""} style={{ maxWidth: "100%", borderRadius: "var(--radius-md)" }} />;
}

export function ResolvedVideo({ mediaId, ownerPreview = false }: { mediaId: string; ownerPreview?: boolean }) {
  const { url, pending, loading } = useResolvedMediaUrl(mediaId, ownerPreview);
  if (loading) return <div className="muted">در حال بارگذاری ویدیو...</div>;
  if (pending) return <div className="muted">🕓 ویدیو در انتظار بررسی است (فقط برای خودت نمایش داده می‌شود)</div>;
  if (!url) return <div className="muted">ویدیو در دسترس نیست</div>;
  return (
    <video controls style={{ maxWidth: "100%", borderRadius: "var(--radius-md)" }}>
      <source src={url} />
    </video>
  );
}
