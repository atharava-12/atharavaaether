import { useCallback } from "react";

export function useGuestMode() {
  const isGuest = false;
  const enterGuestMode = useCallback(() => {}, []);
  const exitGuestMode = useCallback(() => {}, []);
  return { isGuest, enterGuestMode, exitGuestMode };
}
