import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App as CapacitorApp } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { User, Session } from "@supabase/supabase-js";

const isNative = () => Capacitor.isNativePlatform();

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

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

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

  const openOAuth = useCallback(async (provider: "google" | "apple") => {
    if (isNative()) {
      // On native: open in in-app browser
      // We construct the same URL the lovable helper would use, but redirect to a deep link
      // Simplest approach: trigger lovable.auth.signInWithOAuth and let it window.location.href,
      // but intercept by overriding location via Browser plugin.
      const origAssign = window.location.assign.bind(window.location);
      const origHref = Object.getOwnPropertyDescriptor(window.location, "href");
      let captured: string | null = null;
      try {
        // Patch href setter to capture redirect URL
        Object.defineProperty(window.location, "href", {
          configurable: true,
          set: (v: string) => { captured = v; },
          get: () => origHref?.get?.call(window.location) ?? "",
        });
        const result = await lovable.auth.signInWithOAuth(provider, {
          redirect_uri: window.location.origin,
        });
        // Restore
        if (origHref) Object.defineProperty(window.location, "href", origHref);
        if (captured) {
          await Browser.open({ url: captured, presentationStyle: "popover" });
          return { error: null };
        }
        return result;
      } catch (e) {
        if (origHref) Object.defineProperty(window.location, "href", origHref);
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    }
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    return { error: error || null };
  }, []);

  const signInWithGoogle = useCallback(() => openOAuth("google"), [openOAuth]);
  const signInWithApple = useCallback(() => openOAuth("apple"), [openOAuth]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.functions.invoke("delete-account");
    if (!error) await supabase.auth.signOut();
    return { error };
  }, []);

  return { user, session, loading, signInWithGoogle, signInWithApple, signOut, deleteAccount };
}
