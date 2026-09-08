"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch } from "@/lib/client-api";

export function ProfileActions({ targetUserId, loggedIn }: { targetUserId: string; loggedIn: boolean }) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;
    clientFetch(`/follows/${targetUserId}/status`)
      .then((r) => r.json())
      .then((data) => {
        setFollowing(data.following);
        setFollowerCount(data.followerCount);
      })
      .catch(() => {});
  }, [targetUserId, loggedIn]);

  if (!loggedIn) {
    return (
      <a href="/login" className="btn btn-secondary">
        برای دنبال کردن و پیام دادن وارد شو
      </a>
    );
  }

  async function toggleFollow() {
    setBusy(true);
    try {
      if (following) {
        await clientFetch(`/follows/${targetUserId}`, { method: "DELETE" });
        setFollowing(false);
        setFollowerCount((c) => (c ?? 1) - 1);
      } else {
        await clientFetch(`/follows/${targetUserId}`, { method: "POST" });
        setFollowing(true);
        setFollowerCount((c) => (c ?? 0) + 1);
      }
    } finally {
      setBusy(false);
    }
  }

  async function startConversation() {
    setBusy(true);
    try {
      const res = await clientFetch(`/dm/conversations/with/${targetUserId}`, { method: "POST" });
      const conversation = await res.json();
      router.push(`/messages/${conversation.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
      <button className={following ? "btn btn-secondary" : "btn btn-primary"} disabled={busy} onClick={toggleFollow}>
        {following ? "دنبال می‌کنی ✓" : "دنبال کردن"}
      </button>
      <button className="btn btn-secondary" disabled={busy} onClick={startConversation}>
        ✉️ پیام
      </button>
      {followerCount !== null && <span className="muted">{followerCount} دنبال‌کننده</span>}
    </div>
  );
}
