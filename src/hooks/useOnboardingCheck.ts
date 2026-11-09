import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useOnboardingCheck(userId: string | undefined) {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId) {
      setNeedsOnboarding(null);
      return;
    }

    let active = true;
    supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Unable to check onboarding status:", error);
          setNeedsOnboarding(false);
          return;
        }
        setNeedsOnboarding(!data?.onboarding_complete);
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Unable to check onboarding status:", error);
        setNeedsOnboarding(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  return needsOnboarding;
}
