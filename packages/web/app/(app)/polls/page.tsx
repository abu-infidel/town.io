import { redirect } from "next/navigation";
import { getCurrentUser, safeServerFetchJson } from "@/lib/server-api";
import type { PollDto } from "@/lib/types";
import { PollsList } from "@/components/polls/PollsList";

export default async function PollsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await safeServerFetchJson<{ polls: PollDto[]; nextCursor: string | null }>("/polls", { polls: [], nextCursor: null });

  return (
    <div className="container" style={{ maxWidth: 640, paddingTop: 32, paddingBottom: 56 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>نظرسنجی‌های محله</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        صدای واقعی اهالی محله برای مسئولین؛ هر نظرسنجی یه گزارش عمومی قابل دانلود هم داره.
      </p>
      <PollsList initialPolls={data.polls} initialCursor={data.nextCursor} />
    </div>
  );
}
