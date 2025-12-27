import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useMessages } from "@/hooks/useMessages";

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
  const { messages, isLoading, isSending, sendMessage, refresh } = useMessages(
    user.id,
    privateKey
  );

  const handleSend = async (content: string) => {
    return sendMessage(content, user.username);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ChatHeader
        username={user.username}
        publicKey={user.publicKey}
        onLogout={onLogout}
        onRefresh={refresh}
      />

      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <MessageList messages={messages} isLoading={isLoading} />
        <MessageInput onSend={handleSend} isSending={isSending} />
      </main>
    </div>
  );
}
