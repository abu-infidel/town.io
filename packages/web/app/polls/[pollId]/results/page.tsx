import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicFetch } from "@/lib/server-api";
import type { PublicPollResultsDto } from "@/lib/types";

async function loadResults(pollId: string): Promise<PublicPollResultsDto | null> {
  try {
    const res = await publicFetch(`/polls/${pollId}/results`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { pollId: string } }): Promise<Metadata> {
  const results = await loadResults(params.pollId);
  if (!results) return {};
  return { title: `نتایج نظرسنجی: ${results.question} | محله` };
}

export default async function PollResultsPage({ params }: { params: { pollId: string } }) {
  const results = await loadResults(params.pollId);
  if (!results) notFound();

  return (
    <div className="container" style={{ maxWidth: 560, paddingTop: 32, paddingBottom: 56 }}>
      <div className="card">
        <div className="muted" style={{ marginBottom: 8 }}>گزارش عمومی نظرسنجی محله</div>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>{results.question}</h1>
        {results.description && <p className="muted" style={{ marginBottom: 16 }}>{results.description}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {results.options.map((option) => {
            const pct = results.totalVotes > 0 ? Math.round((option.voteCount / results.totalVotes) * 100) : 0;
            return (
              <div key={option.text} style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    insetInlineStart: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    background: "var(--color-brand)",
                    opacity: 0.25,
                    borderRadius: "var(--radius-sm)",
                  }}
                />
                <div style={{ position: "relative", display: "flex", justifyContent: "space-between", padding: "8px 12px" }}>
                  <span>{option.text}</span>
                  <span className="muted">
                    {option.voteCount.toLocaleString("fa-IR")} رای ({pct}٪)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="muted">
            مجموع {results.totalVotes.toLocaleString("fa-IR")} رای از اهالی تایید‌شده محله · {results.closed ? "بسته شده" : "در حال رای‌گیری"}
          </span>
          <a href={`/api/polls/${params.pollId}/results.csv`} className="btn btn-secondary">
            دانلود CSV
          </a>
        </div>
      </div>
    </div>
  );
}
