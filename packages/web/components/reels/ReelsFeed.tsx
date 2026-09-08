"use client";

import { useEffect, useRef, useState } from "react";
import { clientFetch } from "@/lib/client-api";
import type { ReelDto } from "@/lib/types";
import { ReelCard } from "./ReelCard";
import { ReelComposer } from "./ReelComposer";

export function ReelsFeed({ initialReels, initialCursor }: { initialReels: ReelDto[]; initialCursor: string | null }) {
  const [reels, setReels] = useState(initialReels);
  const [cursor, setCursor] = useState(initialCursor);
  const sentinelRef = useRef<HTMLDivElement>(null);

  async function loadMore() {
    if (!cursor) return;
    const res = await clientFetch(`/reels?cursor=${encodeURIComponent(cursor)}`);
    const data = await res.json();
    setReels((r) => [...r, ...data.reels]);
    setCursor(data.nextCursor);
  }

  async function reload() {
    const res = await clientFetch("/reels");
    const data = await res.json();
    setReels(data.reels);
    setCursor(data.nextCursor);
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && loadMore());
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  return (
    <div>
      <ReelComposer onPosted={reload} />

      {reels.length === 0 && <div className="muted">هنوز ریلزی نیست. اولین ریلز محله رو تو بساز!</div>}

      <div
        style={{
          height: "calc(100vh - 220px)",
          minHeight: 400,
          overflowY: "auto",
          scrollSnapType: "y mandatory",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          borderRadius: "var(--radius-lg)",
        }}
      >
        {reels.map((reel) => (
          <ReelCard key={reel.id} reel={reel} />
        ))}
        <div ref={sentinelRef} />
      </div>
    </div>
  );
}
