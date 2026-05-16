import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Zap, UserCircle2, Apple } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestMode } from "@/hooks/useGuestMode";
import SeoHead from "@/components/SeoHead";
import { toast } from "sonner";

const Auth = () => {
  const { user, loading, signInWithGoogle, signInWithApple } = useAuth();
  const { isGuest, enterGuestMode } = useGuestMode();
  const [submitting, setSubmitting] = useState<null | "google" | "apple">(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Zap size={24} className="text-primary animate-pulse" />
      </div>
    );
  }

  if (user || isGuest) return <Navigate to="/" replace />;

  const handleGoogle = async () => {
    setSubmitting("google");
    const { error } = await signInWithGoogle();
    setSubmitting(null);
    if (error) toast.error(error instanceof Error ? error.message : "Google sign-in failed");
  };

  const handleApple = async () => {
    setSubmitting("apple");
    const { error } = await signInWithApple();
    setSubmitting(null);
    if (error) toast.error(error instanceof Error ? error.message : "Apple sign-in failed");
  };

  const handleGuest = () => {
    enterGuestMode();
    toast.success("Signed in as guest. Chat-only mode.");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <SeoHead
        title="Sign in to ChitChat AI"
        description="Sign in to ChitChat AI with Google or Apple to save chats, generate images, and access your memory across devices."
        path="/auth"
      />
      <div className="noise-overlay" />
      <main className="w-full max-w-sm space-y-7 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center">
            <Zap size={24} className="text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-[-0.03em] text-foreground">Sign in to ChitChat</h1>
          <p className="text-sm text-muted-foreground font-mono">Smart conversations, anytime</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogle}
            disabled={submitting !== null}
            className="w-full h-11 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            {submitting === "google" ? "Opening Google..." : "Continue with Google"}
          </button>

          <button
            onClick={handleApple}
            disabled={submitting !== null}
            className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Apple size={18} />
            {submitting === "apple" ? "Opening Apple..." : "Continue with Apple"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-mono">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={handleGuest}
          className="w-full h-11 rounded-xl border border-dashed border-border bg-transparent hover:bg-card text-muted-foreground hover:text-foreground text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <UserCircle2 size={14} />
          Continue as Guest (Chat only)
        </button>

        <p className="text-[10px] text-muted-foreground/50 text-center font-mono">
          AI responses may be inaccurate. Verify important information.
        </p>
      </main>
    </div>
  );
};

export default Auth;
