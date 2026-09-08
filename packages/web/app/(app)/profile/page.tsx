import { redirect } from "next/navigation";
import { getCurrentUser, serverFetch } from "@/lib/server-api";
import type { FullProfileDto } from "@/lib/types";
import { ProfileEditor } from "@/components/editor/ProfileEditor";

export default async function MyProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const res = await serverFetch("/profile/me");
  if (!res.ok) redirect("/login");
  const profile: FullProfileDto = await res.json();

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 56 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24 }}>صفحه من</h1>
        <a href={`/u/${profile.handle}`} target="_blank" rel="noreferrer" className="btn btn-secondary">
          مشاهده صفحه عمومی ↗
        </a>
      </div>
      <ProfileEditor initialProfile={profile} />
    </div>
  );
}
