import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useOnboardingCheck(userId: string | undefined) {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId) {
      setNeedsOnboarding(null);
      return;
    }

    supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        setNeedsOnboarding(!(data as any)?.onboarding_complete);
      });
  }, [userId]);

  return needsOnboarding;
}
