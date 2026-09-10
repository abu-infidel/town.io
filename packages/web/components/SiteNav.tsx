import Link from "next/link";
import { getCurrentUser } from "@/lib/server-api";

export async function SiteNav() {
  const user = await getCurrentUser();

  return (
    <header
      style={{
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      <nav
        className="container"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, flexWrap: "wrap", gap: 8 }}
      >
        <Link href="/" style={{ fontWeight: 800, fontSize: 20, color: "var(--color-brand)" }}>
          محله
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          {user && (
            <>
              <Link href="/feed" className="btn btn-secondary" style={{ padding: "8px 12px" }}>
                🏠 خونه
              </Link>
              <Link href="/reels" className="btn btn-secondary" style={{ padding: "8px 12px" }}>
                🎬 ریلز
              </Link>
              <Link href="/messages" className="btn btn-secondary" style={{ padding: "8px 12px" }}>
                ✉️ پیام‌ها
              </Link>
            </>
          )}
          <Link href="/businesses" className="btn btn-secondary" style={{ padding: "8px 12px" }}>
            🏪 کسب‌وکارها
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <>
              <Link href="/business" className="btn btn-secondary">
                کسب‌وکار من
              </Link>
              <Link href="/profile" className="btn btn-secondary">
                صفحه من
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary">
              ورود / ثبت‌نام
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
