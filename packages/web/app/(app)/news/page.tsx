import { redirect } from "next/navigation";
import { getCurrentUser, safeServerFetchJson } from "@/lib/server-api";
import type { NewsItemDto } from "@/lib/types";
import { NewsList } from "@/components/news/NewsList";

export default async function NewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await safeServerFetchJson<{ news: NewsItemDto[]; nextCursor: string | null }>("/news", { news: [], nextCursor: null });

  return (
    <div className="container" style={{ maxWidth: 640, paddingTop: 32, paddingBottom: 56 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>اخبار شهر</h1>
      <p className="muted" style={{ marginBottom: 20 }}>هر اتفاقی که اهالی محله باید بدونن، اینجاست.</p>
      <NewsList initialNews={data.news} initialCursor={data.nextCursor} />
    </div>
  );
}
