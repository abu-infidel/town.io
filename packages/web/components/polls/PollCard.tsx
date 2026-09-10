"use client";

import { useState } from "react";
import Link from "next/link";
import { clientFetch } from "@/lib/client-api";
import type { PollDto } from "@/lib/types";

export function PollCard({ poll: initialPoll }: { poll: PollDto }) {
  const [poll, setPoll] = useState(initialPoll);
  const [busy, setBusy] = useState(false);

  const revealResults = poll.closed || !!poll.viewerVotedOptionId;

  async function vote(optionId: string) {
    if (poll.viewerVotedOptionId || poll.closed) return;
    setBusy(true);
    try {
      const res = await clientFetch(`/polls/${poll.id}/vote`, { method: "POST", body: JSON.stringify({ optionId }) });
      const updated = await res.json();
      setPoll(updated);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{poll.question}</div>
      {poll.description && <p className="muted" style={{ marginBottom: 10 }}>{poll.description}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {poll.options.map((option) => {
          const pct =
            revealResults && poll.totalVotes && poll.totalVotes > 0 ? Math.round(((option.voteCount ?? 0) / poll.totalVotes) * 100) : 0;
          const mine = poll.viewerVotedOptionId === option.id;

          if (!revealResults) {
            return (
              <button key={option.id} className="btn btn-secondary" disabled={busy} onClick={() => vote(option.id)} style={{ textAlign: "start" }}>
                {option.text}
              </button>
            );
          }

          return (
            <div key={option.id} style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  insetInlineStart: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background: mine ? "var(--color-brand)" : "var(--color-surface-2)",
                  borderRadius: "var(--radius-sm)",
                  opacity: mine ? 0.35 : 1,
                  transition: "width 0.3s",
                }}
              />
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", padding: "8px 12px" }}>
                <span>
                  {mine && "✓ "}
                  {option.text}
                </span>
                <span className="muted">{pct}٪</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <span className="muted">{revealResults ? `${poll.totalVotes ?? 0} رای` : "برای دیدن نتیجه، رای بده"}</span>
        <Link href={`/polls/${poll.id}/results`} target="_blank" className="muted" style={{ textDecoration: "underline" }}>
          گزارش عمومی برای مسئولین
        </Link>
      </div>
    </div>
  );
}
