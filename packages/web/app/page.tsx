import Link from "next/link";
import { getCurrentUser } from "@/lib/server-api";

const UPCOMING = [
  { emoji: "🏪", title: "کسب‌وکارها", desc: "مغازه‌ها و خدمات محلی، با محصولات و تخفیف‌هاشون" },
  { emoji: "📰", title: "اخبار شهر", desc: "بدون از دست دادن هیچ خبری از شهر خودت" },
  { emoji: "🎉", title: "رویدادها", desc: "توی رویدادهای شهر شرکت کن و لحظه‌هاتو نشون بده" },
  { emoji: "🗳️", title: "نظرسنجی‌های مدنی", desc: "صدای اهالی واقعی شهر برای مسئولین" },
  { emoji: "🏅", title: "نشان‌های افتخار", desc: "برای کمک به محله، دیده و قدردانی شو" },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="container" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <section style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>👋</div>
        <h1 style={{ fontSize: 32, marginBottom: 12 }}>
          {user ? `خوش برگشتی، ${user.displayName}!` : "به محله خوش اومدی"}
        </h1>
        <p className="muted" style={{ fontSize: 17, maxWidth: 520, margin: "0 auto" }}>
          محله جایی‌ست فقط برای اهالی این شهر؛ برای اینکه دوباره احساس کنیم همه‌مون بخشی از یک جامعه‌ایم،
          نه یک شبکه‌ی اجتماعی بزرگ و بی‌روح.
        </p>
        {!user && (
          <div style={{ marginTop: 24 }}>
            <Link href="/login" className="btn btn-primary" style={{ fontSize: 16, padding: "14px 28px" }}>
              بیا عضو محله شو
            </Link>
          </div>
        )}
        {user && (
          <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/feed" className="btn btn-primary" style={{ fontSize: 16, padding: "14px 28px" }}>
              🏠 برو به فید محله
            </Link>
            <Link href="/reels" className="btn btn-secondary" style={{ fontSize: 16, padding: "14px 28px" }}>
              🎬 ریلز
            </Link>
            <Link href="/profile" className="btn btn-secondary" style={{ fontSize: 16, padding: "14px 28px" }}>
              شخصی‌سازی صفحه‌ام
            </Link>
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 18, marginBottom: 16, color: "var(--color-text-muted)" }}>به‌زودی در محله</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {UPCOMING.map((item) => (
            <div key={item.title} className="card">
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.emoji}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
              <div className="muted">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
