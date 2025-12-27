import { Button } from "@/components/ui/button";
import { Shield, LogOut, Key, RefreshCw, Users } from "lucide-react";
import { getKeyFingerprint } from "@/lib/crypto";
import { useState, useEffect } from "react";

interface ChatHeaderProps {
  username: string;
  publicKey: string;
  onLogout: () => void;
  onRefresh: () => void;
  selectedUser?: { id: string; username: string } | null;
}

export function ChatHeader({
  username,
  publicKey,
  onLogout,
  onRefresh,
  selectedUser,
}: ChatHeaderProps) {
  const [fingerprint, setFingerprint] = useState<string>("");

  useEffect(() => {
    if (publicKey) {
      getKeyFingerprint(publicKey).then(setFingerprint);
    }
  }, [publicKey]);

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left - Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Secure<span className="text-gradient">Msg</span>
            </h1>
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {selectedUser
                  ? `Chat with ${selectedUser.username}`
                  : "Select a contact to chat"}
              </span>
            </div>
          </div>
        </div>

        {/* Center - Key Fingerprint */}
        <div className="hidden md:flex items-center gap-2">
          <div className="key-indicator">
            <Key className="w-3 h-3" />
            <span>{fingerprint || "..."}</span>
          </div>
        </div>

        {/* Right - User and Actions */}
        <div className="flex items-center gap-2">
          <div className="text-right mr-2">
            <p className="text-sm font-medium text-foreground">{username}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className="text-muted-foreground hover:text-foreground"
            title="Refresh messages"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile Key Fingerprint */}
      <div className="md:hidden px-4 pb-3">
        <div className="key-indicator inline-flex">
          <Key className="w-3 h-3" />
          <span>{fingerprint || "..."}</span>
        </div>
      </div>
    </header>
  );
}
