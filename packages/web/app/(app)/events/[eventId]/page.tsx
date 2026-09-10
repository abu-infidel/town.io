import { notFound, redirect } from "next/navigation";
import { getCurrentUser, safeServerFetchJson } from "@/lib/server-api";
import type { EventDetailDto, EventPostDto } from "@/lib/types";
import { EventDetail } from "@/components/events/EventDetail";

const NOT_FOUND = Symbol("not-found");

export default async function EventDetailPage({ params }: { params: { eventId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [event, postsData] = await Promise.all([
    safeServerFetchJson<EventDetailDto | typeof NOT_FOUND>(`/events/${params.eventId}`, NOT_FOUND),
    safeServerFetchJson<{ posts: EventPostDto[]; nextCursor: string | null }>(`/events/${params.eventId}/posts`, {
      posts: [],
      nextCursor: null,
    }),
  ]);

  if (event === NOT_FOUND) notFound();

  return (
    <div className="container" style={{ maxWidth: 640, paddingTop: 32, paddingBottom: 56 }}>
      <EventDetail initialEvent={event} initialPosts={postsData.posts} initialCursor={postsData.nextCursor} />
    </div>
  );
}
