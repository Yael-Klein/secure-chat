import { User, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserListItem {
  id: string;
  username: string;
  isOnline?: boolean;
}

interface UserListProps {
  users: UserListItem[];
  currentUserId: string;
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  isLoading?: boolean;
}

export function UserList({
  users,
  currentUserId,
  selectedUserId,
  onSelectUser,
  isLoading = false,
}: UserListProps) {
  // Filter out current user
  const otherUsers = users.filter((u) => u.id !== currentUserId);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-muted/30 border-r border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Contacts</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {otherUsers.length} {otherUsers.length === 1 ? "user" : "users"} online
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {otherUsers.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">No other users online</p>
          </div>
        ) : (
          <div className="p-2">
            {otherUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                  "hover:bg-muted/50 active:bg-muted",
                  selectedUserId === user.id && "bg-primary/10 border border-primary/20"
                )}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  {user.isOnline !== false && (
                    <Circle className="w-3 h-3 text-green-500 fill-green-500 absolute -bottom-0.5 -right-0.5 border-2 border-background rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.isOnline !== false ? "Online" : "Offline"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

