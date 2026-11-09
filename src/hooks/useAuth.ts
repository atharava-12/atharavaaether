import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App as CapacitorApp } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { User, Session } from "@supabase/supabase-js";

const isNative = () => Capacitor.isNativePlatform();
const ACTIVE_CONVERSATION_KEY = "chitchat:activeConversationId";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((error) => {
        console.error("Unable to restore the auth session:", error);
        setSession(null);
        setUser(null);
      })
      .finally(() => setLoading(false));

    // Handle deep-link return from in-app browser on native
    let appListener: { remove: () => void } | null = null;
    if (isNative()) {
      CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
        try {
          await Browser.close();
        } catch {}
        // Pass any auth fragment/params back to Supabase if present
        if (url.includes("access_token") || url.includes("code=")) {
          window.location.href = url;
        }
      }).then((l) => { appListener = l; });
    }

    return () => {
      subscription.unsubscribe();
      appListener?.remove();
    };
  }, []);

  const openOAuth = useCallback(async (provider: "google" | "github") => {
    const isLovableSandbox = typeof window !== "undefined" && window.location.hostname.endsWith(".lovable.app");

    if (isNative()) {
      // On native: open in in-app browser
      const origHref = Object.getOwnPropertyDescriptor(window.location, "href");
      let captured: string | null = null;
      try {
        // Patch href setter to capture redirect URL
        Object.defineProperty(window.location, "href", {
          configurable: true,
          set: (v: string) => { captured = v; },
          get: () => origHref?.get?.call(window.location) ?? "",
        });

        let result;
        if (isLovableSandbox && provider === "google") {
          result = await lovable.auth.signInWithOAuth(provider, {
            redirect_uri: window.location.origin,
          });
        } else {
          result = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: window.location.origin,
            },
          });
        }

        // Restore
        if (origHref) Object.defineProperty(window.location, "href", origHref);
        if (captured) {
          await Browser.open({ url: captured, presentationStyle: "popover" });
          return { error: null };
        }
        return { error: result.error || null };
      } catch (e) {
        if (origHref) Object.defineProperty(window.location, "href", origHref);
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    }

    if (isLovableSandbox && provider === "google") {
      // In the Lovable sandbox, use Lovable's OAuth broker proxy
      const { error } = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      return { error: error || null };
    } else {
      // On standard local development (localhost) or Vercel custom domains, use direct Supabase OAuth
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      return { error: error || null };
    }
  }, []);

  const signInWithGoogle = useCallback(() => openOAuth("google"), [openOAuth]);
  const signInWithGitHub = useCallback(() => openOAuth("github"), [openOAuth]);
  const signInWithEmail = useCallback(async (email: string) => {
    let timeoutId: number | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(
        () => reject(new Error("Email verification is taking too long. Check that email sign-in and SMTP are configured in Supabase, then try again.")),
        20_000
      );
    });

    try {
      return await Promise.race([supabase.auth.signInWithOtp({ email }), timeout]);
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    }
  }, []);
  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return { error };
    window.localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    window.dispatchEvent(new CustomEvent("chitchat:active-conversation-changed", { detail: null }));
    return { error: null };
  }, []);

  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.functions.invoke("delete-account");
    if (!error) await supabase.auth.signOut();
    if (!error) return { error: null };

    let message = error.message || "Account deletion failed.";
    if ("context" in error && error.context instanceof Response) {
      try {
        const body = await error.context.clone().json();
        if (typeof body?.error === "string") message = body.error;
      } catch {
        // Keep the function client's message when no JSON error is available.
      }
    }
    return { error: new Error(message) };
  }, []);

  return {
    user,
    session,
    loading,
    signInWithEmail,
    verifyEmailOtp,
    signInWithGitHub,
    signInWithGoogle,
    signOut,
    deleteAccount,
  };
}
