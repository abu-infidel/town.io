"use client";

import { useEffect, useRef, useState } from "react";
import { clientFetch } from "@/lib/client-api";
import { getSocket } from "@/lib/socket";
import type { DirectMessageDto } from "@/lib/types";

interface Props {
  conversationId: string;
  otherUserName: string;
  currentUserId: string;
  initialMessages: DirectMessageDto[];
}

export function MessageThread({ conversationId, otherUserName, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    clientFetch(`/dm/conversations/${conversationId}/read`, { method: "POST" }).catch(() => {});

    const socket = getSocket();
    function onMessage(payload: { conversationId: string; message: DirectMessageDto }) {
      if (payload.conversationId !== conversationId) return;
      setMessages((m) => (m.some((existing) => existing.id === payload.message.id) ? m : [...m, payload.message]));
      clientFetch(`/dm/conversations/${conversationId}/read`, { method: "POST" }).catch(() => {});
    }
    socket.on("dm:message", onMessage);
    return () => {
      socket.off("dm:message", onMessage);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await clientFetch(`/dm/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: text.trim() }),
      });
      const message = await res.json();
      setMessages((m) => [...m, message]);
      setText("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 12, marginBottom: 12 }}>
        <a href="/messages" className="muted">
          ← بازگشت
        </a>
        <h1 style={{ fontSize: 20 }}>{otherUserName}</h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-start" : "flex-end" }}>
              <div
                style={{
                  maxWidth: "75%",
                  padding: "8px 14px",
                  borderRadius: "var(--radius-md)",
                  background: mine ? "var(--color-brand)" : "var(--color-surface-2)",
                  color: mine ? "var(--color-brand-contrast)" : "var(--color-text)",
                }}
              >
                {m.text}
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                  {new Date(m.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: "12px 0" }}>
        <input
          className="input"
          placeholder="پیامت رو بنویس..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn btn-primary" disabled={busy || !text.trim()} onClick={send}>
          ارسال
        </button>
      </div>
    </div>
  );
}
