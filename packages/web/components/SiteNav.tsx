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
      {/* Row 1: brand + account - always exactly one line. */}
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 20, color: "var(--color-brand)" }}>
          محله
        </Link>
        {user ? (
          <Link href="/profile" className="btn btn-secondary">
            صفحه من
          </Link>
        ) : (
          <Link href="/login" className="btn btn-primary">
            ورود / ثبت‌نام
          </Link>
        )}
      </div>

      {/* Row 2: tab strip - horizontally scrollable instead of wrapping, so
          it stays exactly one line no matter how many tabs future phases
          add (a wrapping flex row here previously grew past its container's
          fixed height and got overlapped by the page content below it). */}
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 10,
          scrollbarWidth: "none",
        }}
      >
        {user && (
          <>
            <Link href="/feed" className="btn btn-secondary" style={{ padding: "8px 12px", whiteSpace: "nowrap", flexShrink: 0 }}>
              🏠 خونه
            </Link>
            <Link href="/reels" className="btn btn-secondary" style={{ padding: "8px 12px", whiteSpace: "nowrap", flexShrink: 0 }}>
              🎬 ریلز
            </Link>
            <Link href="/messages" className="btn btn-secondary" style={{ padding: "8px 12px", whiteSpace: "nowrap", flexShrink: 0 }}>
              ✉️ پیام‌ها
            </Link>
            <Link href="/news" className="btn btn-secondary" style={{ padding: "8px 12px", whiteSpace: "nowrap", flexShrink: 0 }}>
              📰 اخبار
            </Link>
            <Link href="/events" className="btn btn-secondary" style={{ padding: "8px 12px", whiteSpace: "nowrap", flexShrink: 0 }}>
              🎉 رویدادها
            </Link>
            <Link href="/polls" className="btn btn-secondary" style={{ padding: "8px 12px", whiteSpace: "nowrap", flexShrink: 0 }}>
              🗳️ نظرسنجی‌ها
            </Link>
          </>
        )}
        <Link href="/businesses" className="btn btn-secondary" style={{ padding: "8px 12px", whiteSpace: "nowrap", flexShrink: 0 }}>
          🏪 کسب‌وکارها
        </Link>
        {user && (
          <Link href="/business" className="btn btn-secondary" style={{ padding: "8px 12px", whiteSpace: "nowrap", flexShrink: 0 }}>
            کسب‌وکار من
          </Link>
        )}
      </div>
    </header>
  );
}
