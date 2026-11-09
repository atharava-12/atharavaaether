import { FormEvent, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Github, LoaderCircle, Mail, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SeoHead from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Auth = () => {
  const { user, loading, signInWithEmail, verifyEmailOtp, signInWithGitHub, signInWithGoogle } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

  const getAuthErrorMessage = (authError: unknown, fallback: string) => {
    if (authError instanceof Error && authError.message) return authError.message;
    if (authError && typeof authError === "object" && "message" in authError) {
      const authMessage = authError.message;
      if (typeof authMessage === "string" && authMessage) return authMessage;
    }
    return fallback;
  };

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

  if (user) return <Navigate to={destination} replace />;

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const { error: signInError } = await signInWithEmail(email.trim());
      if (signInError) throw signInError;
      setOtpSent(true);
      setMessage(`Enter the 8-digit code sent to ${email.trim()}.`);
    } catch (signInError) {
      setError(getAuthErrorMessage(signInError, "Unable to send the verification code. Check your email settings and try again."));
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const { error: verifyError } = await verifyEmailOtp(email.trim(), otp);
      if (verifyError) throw verifyError;
    } catch (verifyError) {
      setError(getAuthErrorMessage(verifyError, "That code could not be verified. Check the code and try again."));
    } finally {
      setBusy(false);
    }
  };

  const signInWithProvider = async (provider: "github" | "google") => {
    setBusy(true);
    setError("");
    try {
      const result = provider === "github" ? await signInWithGitHub() : await signInWithGoogle();
      if (result.error) throw result.error;
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Unable to start sign-in.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <SeoHead
        title="Sign in to ChitChat"
        description="Continue to ChitChat with email, GitHub, or Google."
        path="/auth"
      />
      <div className="noise-overlay" />

      <main className="relative z-10 w-full max-w-sm border border-border bg-card p-7 shadow-sm">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Zap size={22} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Welcome to ChitChat</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue to your conversations.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            disabled={busy}
            onClick={() => void signInWithProvider("google")}
          >
            {busy ? <LoaderCircle className="animate-spin" /> : <span className="font-semibold text-base">G</span>}
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            disabled={busy}
            onClick={() => void signInWithProvider("github")}
          >
            <Github />
            Continue with GitHub
          </Button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>OR</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {!otpSent ? (
          <form className="space-y-3" onSubmit={submitEmail}>
            <label htmlFor="email" className="text-sm font-medium text-foreground">Email address</label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={busy}
            />
            <Button type="submit" className="h-11 w-full" disabled={busy || !email.trim()}>
              {busy ? <LoaderCircle className="animate-spin" /> : <Mail />}
              Continue with Email
            </Button>
          </form>
        ) : (
          <form className="space-y-3" onSubmit={submitOtp}>
            <label htmlFor="otp" className="text-sm font-medium text-foreground">8-digit verification code</label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{8}"
              maxLength={8}
              placeholder="00000000"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))}
              required
              disabled={busy}
              className="text-center font-mono text-lg tracking-[0.35em]"
            />
            <Button type="submit" className="h-11 w-full" disabled={busy || otp.length !== 8}>
              {busy ? <LoaderCircle className="animate-spin" /> : <Mail />}
              Verify code
            </Button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              disabled={busy}
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setMessage("");
                setError("");
              }}
            >
              Use a different email
            </button>
          </form>
        )}

        {message && <p role="status" className="mt-4 text-center text-sm text-primary">{message}</p>}
        {error && <p role="alert" className="mt-4 text-center text-sm text-destructive">{error}</p>}
      </main>
    </div>
  );
};

export default Auth;
