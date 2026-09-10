"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/client-api";
import type { PollDto } from "@/lib/types";
import { PollComposer } from "./PollComposer";
import { PollCard } from "./PollCard";

export function PollsList({ initialPolls, initialCursor }: { initialPolls: PollDto[]; initialCursor: string | null }) {
  const [polls, setPolls] = useState(initialPolls);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      const res = await clientFetch(`/polls?cursor=${encodeURIComponent(cursor)}`);
      const data = await res.json();
      setPolls((p) => [...p, ...data.polls]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PollComposer onCreated={(poll) => setPolls((p) => [poll, ...p])} />

      {polls.length === 0 && <div className="muted">هنوز نظرسنجی‌ای نیست. اولین نفری باش که یه دغدغه رو مطرح می‌کنه.</div>}

      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} />
      ))}

      {cursor && (
        <button className="btn btn-secondary" onClick={loadMore} disabled={loading} style={{ width: "100%" }}>
          {loading ? "..." : "بیشتر ببین"}
        </button>
      )}
    </div>
  );
}
