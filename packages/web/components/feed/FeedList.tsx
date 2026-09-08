"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/client-api";
import type { PostDto } from "@/lib/types";
import { PostComposer } from "./PostComposer";
import { PostCard } from "./PostCard";

export function FeedList({ initialPosts, initialCursor }: { initialPosts: PostDto[]; initialCursor: string | null }) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await clientFetch(`/posts?cursor=${encodeURIComponent(cursor)}`);
      const data = await res.json();
      setPosts((p) => [...p, ...data.posts]);
      setCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <PostComposer onPosted={(post) => setPosts((p) => [post, ...p])} />

      {posts.length === 0 && <div className="muted">هنوز پیامی نیست. اولین نفری باش که چیزی می‌نویسه!</div>}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {cursor && (
        <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore} style={{ width: "100%" }}>
          {loadingMore ? "..." : "بیشتر ببین"}
        </button>
      )}
    </div>
  );
}
