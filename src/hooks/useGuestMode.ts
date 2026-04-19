import { useState, useEffect, useCallback } from "react";

const GUEST_KEY = "chitchat_guest_mode";
const GUEST_MESSAGES_KEY = "chitchat_guest_messages";
const GUEST_CONVERSATIONS_KEY = "chitchat_guest_conversations";

export function useGuestMode() {
  const [isGuest, setIsGuest] = useState<boolean>(() => localStorage.getItem(GUEST_KEY) === "true");

  useEffect(() => {
    const handler = () => setIsGuest(localStorage.getItem(GUEST_KEY) === "true");
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const enterGuestMode = useCallback(() => {
    localStorage.setItem(GUEST_KEY, "true");
    setIsGuest(true);
  }, []);

  const exitGuestMode = useCallback(() => {
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem(GUEST_MESSAGES_KEY);
    localStorage.removeItem(GUEST_CONVERSATIONS_KEY);
    setIsGuest(false);
  }, []);

  return { isGuest, enterGuestMode, exitGuestMode };
}

export const GUEST_STORAGE_KEYS = {
  MESSAGES: GUEST_MESSAGES_KEY,
  CONVERSATIONS: GUEST_CONVERSATIONS_KEY,
};
