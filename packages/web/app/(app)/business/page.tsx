import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, safeServerFetchJson } from "@/lib/server-api";
import type { BusinessListItemDto } from "@/lib/types";
import { CreateBusinessForm } from "@/components/business/CreateBusinessForm";

const STATUS_LABELS_FA: Record<string, string> = {
  pending: "در صف بررسی",
  auto_approved: "منتشر شده",
  approved: "منتشر شده",
  needs_human_review: "در انتظار تایید",
  auto_rejected: "رد شده",
  rejected: "رد شده",
};

export default async function MyBusinessesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const businesses = await safeServerFetchJson<BusinessListItemDto[]>("/business/mine", []);

  return (
    <div className="container" style={{ maxWidth: 640, paddingTop: 32, paddingBottom: 56 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>کسب‌وکار من</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        نمایش محصولات و تخفیف‌ها رایگان است؛ صفحه‌ات مثل بلاگ کاملاً قابل شخصی‌سازی‌ست.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {businesses.map((b) => (
          <Link
            key={b.id}
            href={`/business/${b.id}`}
            className="card"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{b.name}</div>
              {b.neighborhood && <div className="muted">📍 {b.neighborhood}</div>}
            </div>
            <span className="muted">{STATUS_LABELS_FA[b.moderationStatus] ?? b.moderationStatus}</span>
          </Link>
        ))}
      </div>

      <CreateBusinessForm />
    </div>
  );
}
