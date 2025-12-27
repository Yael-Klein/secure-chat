import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/AuthForm";
import { ChatView } from "@/components/ChatView";
import { Loader2, Shield } from "lucide-react";

const Index = () => {
  const { user, privateKey, isAuthenticated, isLoading, register, login, logout } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4 animate-pulse-glow">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading secure session...</span>
          </div>
        </div>
      </div>
    );
  }

  // Auth form
  if (!isAuthenticated || !user || !privateKey) {
    return <AuthForm onRegister={register} onLogin={login} />;
  }

  // Chat view
  return <ChatView user={user} privateKey={privateKey} onLogout={logout} />;
};

export default Index;
