import { redirect } from "next/navigation";
import { getCurrentUser, safeServerFetchJson } from "@/lib/server-api";
import type { DirectMessageDto } from "@/lib/types";
import { MessageThread } from "@/components/messages/MessageThread";

const NOT_FOUND = Symbol("not-found");

export default async function ConversationPage({ params }: { params: { conversationId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [info, messagesData] = await Promise.all([
    safeServerFetchJson<{ otherUser: { id: string; displayName: string } | null } | typeof NOT_FOUND>(
      `/dm/conversations/${params.conversationId}`,
      NOT_FOUND
    ),
    safeServerFetchJson<{ messages: DirectMessageDto[]; nextCursor: string | null }>(
      `/dm/conversations/${params.conversationId}/messages`,
      { messages: [], nextCursor: null }
    ),
  ]);

  if (info === NOT_FOUND) redirect("/messages");

  return (
    <div className="container" style={{ maxWidth: 560, paddingTop: 24, paddingBottom: 0, height: "calc(100vh - 64px)" }}>
      <MessageThread
        conversationId={params.conversationId}
        otherUserName={info.otherUser?.displayName ?? "کاربر"}
        currentUserId={user.id}
        initialMessages={messagesData.messages}
      />
    </div>
  );
}
