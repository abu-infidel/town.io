"use client";

import { useState } from "react";
import Link from "next/link";
import { clientFetch } from "@/lib/client-api";
import type { EventListItemDto } from "@/lib/types";
import { EventComposer } from "./EventComposer";

export function EventsList({ initialEvents, initialCursor }: { initialEvents: EventListItemDto[]; initialCursor: string | null }) {
  const [when, setWhen] = useState<"upcoming" | "past">("upcoming");
  const [events, setEvents] = useState(initialEvents);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  async function switchTab(next: "upcoming" | "past") {
    setWhen(next);
    setLoading(true);
    try {
      const res = await clientFetch(`/events?when=${next}`);
      const data = await res.json();
      setEvents(data.events);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      const res = await clientFetch(`/events?when=${when}&cursor=${encodeURIComponent(cursor)}`);
      const data = await res.json();
      setEvents((e) => [...e, ...data.events]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <EventComposer onCreated={(event) => setEvents((e) => (when === "upcoming" ? [event, ...e] : e))} />

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={when === "upcoming" ? "btn btn-primary" : "btn btn-secondary"} onClick={() => switchTab("upcoming")}>
          پیش رو
        </button>
        <button className={when === "past" ? "btn btn-primary" : "btn btn-secondary"} onClick={() => switchTab("past")}>
          گذشته
        </button>
      </div>

      {!loading && events.length === 0 && <div className="muted">رویدادی پیدا نشد.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {events.map((event) => (
          <Link key={event.id} href={`/events/${event.id}`} className="card">
            {event.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.coverUrl} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: "var(--radius-md)", marginBottom: 10 }} />
            )}
            <div style={{ fontWeight: 700, fontSize: 17 }}>{event.title}</div>
            <div className="muted">
              🗓️ {new Date(event.startAt).toLocaleString("fa-IR")}
              {event.location && ` · 📍 ${event.location}`}
            </div>
            <div className="muted">{event.rsvpCount} نفر میان</div>
          </Link>
        ))}
      </div>

      {cursor && (
        <button className="btn btn-secondary" onClick={loadMore} disabled={loading} style={{ width: "100%", marginTop: 12 }}>
          {loading ? "..." : "بیشتر ببین"}
        </button>
      )}
    </div>
  );
}
