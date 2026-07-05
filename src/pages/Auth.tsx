import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Zap, UserCircle2, Mail, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestMode } from "@/hooks/useGuestMode";
import { supabase } from "@/integrations/supabase/client";
import SeoHead from "@/components/SeoHead";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Auth = () => {
  const { user, loading } = useAuth();
  const { isGuest, enterGuestMode, exitGuestMode } = useGuestMode();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  useEffect(() => {
    if (isGuest) {
      exitGuestMode();
    }
  }, [isGuest]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Zap size={24} className="text-primary animate-pulse" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setShowOtpInput(true);
      toast.success("Verification code sent! Please check your email.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please enter the verification code");
      return;
    }

    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (error) throw error;
      toast.success("Successfully authenticated!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired code");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuest = () => {
    enterGuestMode();
    toast.success("Signed in as guest. Chat-only mode.");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <SeoHead
        title="Sign in to ChitChat AI"
        description="Sign in to ChitChat AI with your email to save chats, generate images, and access your memory across devices."
        path="/auth"
      />
      <div className="noise-overlay" />
      
      <main className="w-full max-w-sm space-y-6 relative z-10 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Zap size={22} />
          </div>
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
            {showOtpInput ? "Verify your email" : "Welcome to ChitChat"}
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            {showOtpInput ? "Enter the 8-digit code sent to your inbox" : "Sign in or register securely with a code"}
          </p>
        </div>

        {!showOtpInput ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={authLoading}
                  className="pl-9 bg-background"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-10 mt-2" disabled={authLoading}>
              {authLoading ? "Sending Code..." : "Continue with Email"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="token">Verification Code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="token"
                  type="text"
                  placeholder="12345678"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={authLoading}
                  className="pl-9 bg-background tracking-widest font-mono text-center text-lg"
                  maxLength={8}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-10 mt-2" disabled={authLoading}>
              {authLoading ? "Verifying..." : "Verify & Sign In"}
            </Button>

            <button
              type="button"
              onClick={() => setShowOtpInput(false)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline pt-1"
              disabled={authLoading}
            >
              ← Back to email entry
            </button>
          </form>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground font-mono">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGuest}
          disabled={authLoading}
          className="w-full h-10 rounded-xl border border-dashed border-border bg-transparent hover:bg-secondary/50 text-muted-foreground hover:text-foreground text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <UserCircle2 size={14} />
          Continue as Guest (Chat only)
        </button>

        <p className="text-[9px] text-muted-foreground/40 text-center font-mono">
          AI responses may be inaccurate. Verify important information.
        </p>
      </main>
    </div>
  );
};

export default Auth;
