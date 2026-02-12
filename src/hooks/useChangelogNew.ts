import { useState, useCallback } from "react";
import { LAST_UPDATED } from "@/pages/Changelog";

const STORAGE_KEY = "changelog-last-seen";

export function useChangelogNew() {
  const [lastSeen, setLastSeen] = useState(() => localStorage.getItem(STORAGE_KEY));

  const isNew = lastSeen !== LAST_UPDATED;

  const markSeen = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, LAST_UPDATED);
    setLastSeen(LAST_UPDATED);
  }, []);

  return { isNew, markSeen };
}
