import { redirect } from "next/navigation";
import { getCurrentUser, safeServerFetchJson } from "@/lib/server-api";
import type { ReelDto } from "@/lib/types";
import { ReelsFeed } from "@/components/reels/ReelsFeed";

export default async function ReelsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await safeServerFetchJson<{ reels: ReelDto[]; nextCursor: string | null }>("/reels", {
    reels: [],
    nextCursor: null,
  });

  return (
    <div className="container" style={{ maxWidth: 480, paddingTop: 24, paddingBottom: 32 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>ریلز</h1>
      <ReelsFeed initialReels={data.reels} initialCursor={data.nextCursor} />
    </div>
  );
}
