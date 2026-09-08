import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, safeServerFetchJson } from "@/lib/server-api";
import type { ConversationSummaryDto } from "@/lib/types";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const conversations = await safeServerFetchJson<ConversationSummaryDto[]>("/dm/conversations", []);

  return (
    <div className="container" style={{ maxWidth: 560, paddingTop: 32, paddingBottom: 56 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>پیام‌ها</h1>

      {conversations.length === 0 && <div className="muted">هنوز گفت‌وگویی نداری. از صفحه پروفایل کسی، «پیام» بزن.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {conversations.map((c) => (
          <Link
            key={c.conversationId}
            href={`/messages/${c.conversationId}`}
            className="card"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{c.otherUser?.displayName ?? "کاربر"}</div>
              {c.lastMessage && (
                <div className="muted" style={{ maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.lastMessage.text}
                </div>
              )}
            </div>
            {c.unreadCount > 0 && (
              <span
                style={{
                  background: "var(--color-brand)",
                  color: "var(--color-brand-contrast)",
                  borderRadius: 999,
                  padding: "2px 10px",
                  fontSize: 13,
                }}
              >
                {c.unreadCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
