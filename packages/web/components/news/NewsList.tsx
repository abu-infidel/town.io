"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/client-api";
import type { NewsItemDto } from "@/lib/types";
import { NewsComposer } from "./NewsComposer";

export function NewsList({ initialNews, initialCursor }: { initialNews: NewsItemDto[]; initialCursor: string | null }) {
  const [news, setNews] = useState(initialNews);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await clientFetch(`/news?cursor=${encodeURIComponent(cursor)}`);
      const data = await res.json();
      setNews((n) => [...n, ...data.news]);
      setCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <NewsComposer onPosted={(item) => setNews((n) => [item, ...n])} />

      {news.length === 0 && <div className="muted">هنوز خبری منتشر نشده.</div>}

      {news.map((item) => (
        <article key={item.id} className="card" style={{ marginBottom: 16 }}>
          {item.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.coverUrl} alt="" style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: "var(--radius-md)", marginBottom: 12 }} />
          )}
          <h2 style={{ fontSize: 19, marginBottom: 6 }}>{item.title}</h2>
          <div className="muted" style={{ marginBottom: 10, fontSize: 13 }}>
            {item.author.displayName} · {new Date(item.createdAt).toLocaleString("fa-IR")}
          </div>
          <p style={{ whiteSpace: "pre-wrap" }}>{item.body}</p>
        </article>
      ))}

      {cursor && (
        <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore} style={{ width: "100%" }}>
          {loadingMore ? "..." : "بیشتر ببین"}
        </button>
      )}
    </div>
  );
}
