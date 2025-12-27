import { useEffect, useRef } from "react";
import { Lock, CheckCheck, User } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  senderId: string;
  senderUsername: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Decrypting messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No messages yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Send your first encrypted message. All messages are end-to-end encrypted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
    >
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          showAvatar={
            index === 0 ||
            messages[index - 1].senderId !== message.senderId
          }
        />
      ))}
    </div>
  );
}

function MessageBubble({
  message,
  showAvatar,
}: {
  message: Message;
  showAvatar: boolean;
}) {
  return (
    <div
      className={`flex gap-3 animate-encrypt ${
        message.isOwn ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatar */}
      {showAvatar ? (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            message.isOwn
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <User className="w-4 h-4" />
        </div>
      ) : (
        <div className="w-8" />
      )}

      {/* Message Content */}
      <div
        className={`message-bubble ${
          message.isOwn ? "message-bubble-sent" : "message-bubble-received"
        }`}
      >
        {/* Sender Name */}
        {showAvatar && (
          <p
            className={`text-xs font-medium mb-1 ${
              message.isOwn ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {message.isOwn ? "You" : message.senderUsername}
          </p>
        )}

        {/* Message Text */}
        <p className="text-sm text-foreground leading-relaxed">
          {message.content}
        </p>

        {/* Footer */}
        <div
          className={`flex items-center gap-2 mt-2 ${
            message.isOwn ? "justify-end" : ""
          }`}
        >
          <span className="encrypted-indicator">
            <Lock className="w-3 h-3" />
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.timestamp), "HH:mm")}
          </span>
          {message.isOwn && (
            <CheckCheck className="w-3 h-3 text-primary" />
          )}
        </div>
      </div>
    </div>
  );
}
