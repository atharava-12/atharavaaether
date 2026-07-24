import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SeoHead from "@/components/SeoHead";

const Auth = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    document.title = "ChitChat AI";
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Zap size={24} className="text-primary animate-pulse" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <SeoHead
        title="Authentication Disabled"
        description="Authentication is temporarily disabled while we focus on core app features."
        path="/auth"
      />
      <div className="noise-overlay" />

      <main className="w-full max-w-sm space-y-6 relative z-10 bg-card border border-border p-6 rounded-2xl shadow-sm text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Zap size={22} />
          </div>
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground">Authentication Disabled</h1>
          <p className="text-sm text-muted-foreground font-mono">
            Login and guest mode are disabled for now so you can use the app features directly.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Auth;
