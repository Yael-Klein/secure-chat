import { useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { UserList } from "./UserList";
import { useMessages } from "@/hooks/useMessages";
import { useUsers } from "@/hooks/useUsers";

interface User {
  id: string;
  username: string;
  publicKey: string;
}

interface ChatViewProps {
  user: User;
  privateKey: CryptoKey;
  onLogout: () => void;
}

export function ChatView({ user, privateKey, onLogout }: ChatViewProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { users, isLoading: usersLoading } = useUsers();
  const { messages, isLoading, isSending, sendMessage, refresh } = useMessages(
    user.id,
    privateKey,
    selectedUserId
  );

  const selectedUser = selectedUserId
    ? users.find((u) => u.id === selectedUserId)
    : null;

  const handleSend = async (content: string) => {
    return sendMessage(content, user.username, selectedUserId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ChatHeader
        username={user.username}
        publicKey={user.publicKey}
        onLogout={onLogout}
        onRefresh={refresh}
        selectedUser={selectedUser}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* User List Sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-border">
          <UserList
            users={users}
            currentUserId={user.id}
            selectedUserId={selectedUserId}
            onSelectUser={(userId) => setSelectedUserId(userId)}
            isLoading={usersLoading}
          />
        </div>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {selectedUser ? (
            <>
              <div className="border-b border-border px-4 py-3 bg-card/50">
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedUser.username}
                </h2>
                <p className="text-xs text-muted-foreground">
                  End-to-end encrypted conversation
                </p>
              </div>
              <MessageList messages={messages} isLoading={isLoading} />
              <MessageInput onSend={handleSend} isSending={isSending} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Select a contact
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose a user from the sidebar to start a secure conversation.
                  Messages are encrypted end-to-end.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
