import { redirect } from "next/navigation";
import { getCurrentUser, safeServerFetchJson } from "@/lib/server-api";
import type { PostDto } from "@/lib/types";
import { FeedList } from "@/components/feed/FeedList";

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await safeServerFetchJson<{ posts: PostDto[]; nextCursor: string | null }>("/posts", {
    posts: [],
    nextCursor: null,
  });

  return (
    <div className="container" style={{ maxWidth: 560, paddingTop: 32, paddingBottom: 56 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>خونه</h1>
      <FeedList initialPosts={data.posts} initialCursor={data.nextCursor} />
    </div>
  );
}
