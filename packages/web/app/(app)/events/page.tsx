import { redirect } from "next/navigation";
import { getCurrentUser, safeServerFetchJson } from "@/lib/server-api";
import type { EventListItemDto } from "@/lib/types";
import { EventsList } from "@/components/events/EventsList";

export default async function EventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await safeServerFetchJson<{ events: EventListItemDto[]; nextCursor: string | null }>("/events?when=upcoming", {
    events: [],
    nextCursor: null,
  });

  return (
    <div className="container" style={{ maxWidth: 640, paddingTop: 32, paddingBottom: 56 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>رویدادهای شهر</h1>
      <p className="muted" style={{ marginBottom: 20 }}>توی رویدادهای شهر شرکت کن و زاویه دید خودتو نشون بده.</p>
      <EventsList initialEvents={data.events} initialCursor={data.nextCursor} />
    </div>
  );
}
