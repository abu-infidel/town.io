"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { clientFetch } from "@/lib/client-api";
import type { ReelDto } from "@/lib/types";
import { CommentSection } from "@/components/feed/CommentSection";

export function ReelCard({ reel }: { reel: ReelDto }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [liked, setLiked] = useState(reel.likedByViewer);
  const [likeCount, setLikeCount] = useState(reel.likeCount);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  async function toggleLike() {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    await clientFetch(`/reels/${reel.id}/like`, { method: "POST" });
  }

  const authorHref = reel.author.handle ? `/u/${reel.author.handle}` : undefined;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: "100%",
        scrollSnapAlign: "start",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      {reel.videoUrl ? (
        <video
          ref={videoRef}
          src={reel.videoUrl}
          loop
          muted={muted}
          playsInline
          onClick={() => setMuted((m) => !m)}
          style={{ width: "100%", height: "100%", objectFit: "contain", cursor: "pointer" }}
        />
      ) : (
        <div style={{ color: "#fff", textAlign: "center", padding: 24 }}>
          🕓 این ریلز در حال پردازش یا بررسی است
          <br />
          <span style={{ opacity: 0.7, fontSize: 13 }}>چند لحظه دیگر دوباره سر بزن</span>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 0,
          insetInline: 0,
          padding: 16,
          background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
          color: "#fff",
        }}
      >
        {authorHref ? (
          <Link href={authorHref} style={{ color: "#fff", fontWeight: 700 }}>
            {reel.author.displayName}
          </Link>
        ) : (
          <span style={{ fontWeight: 700 }}>{reel.author.displayName}</span>
        )}
        {reel.caption && <p style={{ margin: "6px 0" }}>{reel.caption}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={toggleLike}>
            {liked ? "❤️" : "🤍"} {likeCount > 0 ? likeCount : ""}
          </button>
          <div style={{ colorScheme: "dark" }}>
            <CommentSection basePath={`/reels/${reel.id}`} initialCount={reel.commentCount} />
          </div>
        </div>
      </div>
    </div>
  );
}
