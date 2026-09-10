import { notFound, redirect } from "next/navigation";
import { getCurrentUser, safeServerFetchJson } from "@/lib/server-api";
import type { OwnedBusinessDto } from "@/lib/types";
import { BusinessEditor } from "@/components/business/BusinessEditor";

const NOT_FOUND = Symbol("not-found");

export default async function BusinessEditorPage({ params }: { params: { businessId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await safeServerFetchJson<OwnedBusinessDto | typeof NOT_FOUND>(`/business/${params.businessId}`, NOT_FOUND);
  if (business === NOT_FOUND) notFound();

  return (
    <div className="container" style={{ maxWidth: 720, paddingTop: 32, paddingBottom: 56 }}>
      <BusinessEditor initialBusiness={business} />
    </div>
  );
}
