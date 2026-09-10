"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/client-api";
import { MediaUploader } from "@/components/editor/MediaUploader";
import { CommentSection } from "@/components/feed/CommentSection";
import type { EventDetailDto, EventPostDto } from "@/lib/types";

function EventPostCard({ post }: { post: EventPostDto }) {
  const [liked, setLiked] = useState(post.likedByViewer);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  async function toggleLike() {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    await clientFetch(`/events/posts/${post.id}/like`, { method: "POST" });
  }

  return (
    <article className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontWeight: 700 }}>{post.author.displayName}</span>
        <span className="muted">{new Date(post.createdAt).toLocaleString("fa-IR")}</span>
      </div>
      <p style={{ whiteSpace: "pre-wrap", marginBottom: post.media.length ? 12 : 0 }}>{post.text}</p>
      {post.media.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: post.media.length === 1 ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {post.media.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" style={{ width: "100%", borderRadius: "var(--radius-md)" }} />
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>
        <button className={liked ? "btn btn-primary" : "btn btn-secondary"} onClick={toggleLike}>
          {liked ? "❤️" : "🤍"} {likeCount > 0 ? likeCount : ""}
        </button>
        <CommentSection basePath={`/events/posts/${post.id}`} initialCount={post.commentCount} />
      </div>
    </article>
  );
}

function EventPostComposer({ eventId, onPosted }: { eventId: string; onPosted: (post: EventPostDto) => void }) {
  const [text, setText] = useState("");
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await clientFetch(`/events/${eventId}/posts`, { method: "POST", body: JSON.stringify({ text: text.trim(), mediaIds }) });
      const data = await res.json();
      onPosted({
        id: data.id,
        text: data.text,
        createdAt: data.createdAt,
        author: { id: "", displayName: "شما" },
        media: [],
        likeCount: 0,
        commentCount: 0,
        likedByViewer: false,
      });
      setText("");
      setMediaIds([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <textarea
        className="input"
        rows={2}
        placeholder="زاویه دید تو از این رویداد چیه؟ عکس و حرفت رو بذار..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {mediaIds.length < 4 && <MediaUploader accept="image" label="افزودن عکس" onUploaded={(id) => setMediaIds((ids) => [...ids, id])} />}
          {mediaIds.length > 0 && <span className="muted">{mediaIds.length} عکس</span>}
        </div>
        <button className="btn btn-primary" disabled={busy || !text.trim()} onClick={submit}>
          {busy ? "..." : "ارسال"}
        </button>
      </div>
    </div>
  );
}

export function EventDetail({
  initialEvent,
  initialPosts,
  initialCursor,
}: {
  initialEvent: EventDetailDto;
  initialPosts: EventPostDto[];
  initialCursor: string | null;
}) {
  const [event, setEvent] = useState(initialEvent);
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [busy, setBusy] = useState(false);

  async function toggleRsvp() {
    setBusy(true);
    try {
      const res = await clientFetch(`/events/${event.id}/rsvp`, { method: "POST" });
      const data = await res.json();
      setEvent((e) => ({ ...e, viewerGoing: data.going, rsvpCount: e.rsvpCount + (data.going ? 1 : -1) }));
    } finally {
      setBusy(false);
    }
  }

  async function loadMore() {
    if (!cursor) return;
    const res = await clientFetch(`/events/${event.id}/posts?cursor=${encodeURIComponent(cursor)}`);
    const data = await res.json();
    setPosts((p) => [...p, ...data.posts]);
    setCursor(data.nextCursor);
  }

  return (
    <div>
      {event.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.coverUrl} alt="" style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: "var(--radius-lg)", marginBottom: 16 }} />
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>{event.title}</h1>
        <div className="muted" style={{ marginBottom: 4 }}>
          🗓️ {new Date(event.startAt).toLocaleString("fa-IR")}
        </div>
        {event.location && <div className="muted" style={{ marginBottom: 4 }}>📍 {event.location}</div>}
        <div className="muted" style={{ marginBottom: 12 }}>
          برگزارکننده: {event.creator.displayName}
        </div>
        <p style={{ whiteSpace: "pre-wrap", marginBottom: 16 }}>{event.description}</p>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className={event.viewerGoing ? "btn btn-primary" : "btn btn-secondary"} disabled={busy} onClick={toggleRsvp}>
            {event.viewerGoing ? "میام ✓" : "میام"}
          </button>
          <span className="muted">{event.rsvpCount} نفر میان</span>
        </div>
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 12, color: "var(--color-text-muted)" }}>لحظه‌های این رویداد</h2>
      <EventPostComposer eventId={event.id} onPosted={(post) => setPosts((p) => [post, ...p])} />

      {posts.length === 0 && <div className="muted">هنوز کسی از این رویداد چیزی نگذاشته. اولین نفر باش.</div>}
      {posts.map((post) => (
        <EventPostCard key={post.id} post={post} />
      ))}

      {cursor && (
        <button className="btn btn-secondary" onClick={loadMore} style={{ width: "100%" }}>
          بیشتر ببین
        </button>
      )}
    </div>
  );
}
