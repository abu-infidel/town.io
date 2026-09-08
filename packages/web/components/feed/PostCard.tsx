"use client";

import { useState } from "react";
import Link from "next/link";
import { clientFetch } from "@/lib/client-api";
import type { PostDto } from "@/lib/types";
import { CommentSection } from "./CommentSection";

export function PostCard({ post }: { post: PostDto }) {
  const [liked, setLiked] = useState(post.likedByViewer);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  async function toggleLike() {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    await clientFetch(`/posts/${post.id}/like`, { method: "POST" });
  }

  const authorHref = post.author.handle ? `/u/${post.author.handle}` : undefined;

  return (
    <article className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          {authorHref ? (
            <Link href={authorHref} style={{ fontWeight: 700 }}>
              {post.author.displayName}
            </Link>
          ) : (
            <span style={{ fontWeight: 700 }}>{post.author.displayName}</span>
          )}
          {post.author.neighborhood && (
            <span className="muted">
              {" "}
              · 📍 {post.author.neighborhood}
              {post.sameNeighborhood && " (همسایه)"}
            </span>
          )}
        </div>
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

      <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--color-border)", paddingTop: 10, marginTop: 4 }}>
        <button className={liked ? "btn btn-primary" : "btn btn-secondary"} onClick={toggleLike}>
          {liked ? "❤️" : "🤍"} {likeCount > 0 ? likeCount : ""}
        </button>
        <CommentSection basePath={`/posts/${post.id}`} initialCount={post.commentCount} />
      </div>
    </article>
  );
}
