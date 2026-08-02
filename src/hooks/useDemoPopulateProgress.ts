import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DemoProgressCounts {
  foodEntries: number;
  weightSets: number;
  customLogEntries: number;
  savedMeals: number;
  savedRoutines: number;
}

const POLL_MS = 3000;
const IDLE_STOP_MS = 60_000; // counts unchanged this long => treat as finished
const MAX_RUN_MS = 15 * 60_000;
const STORAGE_KEY = "demo-populate-started-at";

/** Records that a populate run just kicked off, so the Admin page can poll it. */
export function markDemoPopulateStarted() {
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
  window.dispatchEvent(new Event("demo-populate-started"));
}

function readStartedAt(): number | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || Date.now() - value > MAX_RUN_MS) return null;
  return value;
}

interface RawUserStats {
  user_id: string;
  is_read_only: boolean;
  total_entries: number;
  total_weight_entries: number;
  custom_log_entries_count: number;
  saved_meals_count: number;
  saved_routines_count: number;
}

/**
 * Polls the admin user-stats function for the demo account's row totals so the
 * Admin page can show progress while the edge function runs in the background.
 * The run's start time lives in localStorage, so a reload resumes polling.
 */
export function useDemoPopulateProgress() {
  const [startedAt, setStartedAt] = useState<number | null>(() => readStartedAt());
  const [stopped, setStopped] = useState(false);
  const lastChangeAt = useRef<number>(Date.now());
  const lastSignature = useRef<string>("");

  // A run started elsewhere on the page (the dialog) should wake polling up.
  useEffect(() => {
    const onStart = () => {
      lastChangeAt.current = Date.now();
      lastSignature.current = "";
      setStopped(false);
      setStartedAt(readStartedAt());
    };
    window.addEventListener("demo-populate-started", onStart);
    return () => window.removeEventListener("demo-populate-started", onStart);
  }, []);

  const active = startedAt !== null;

  const query = useQuery({
    queryKey: ["demo-populate-progress"],
    enabled: active && !stopped,
    refetchInterval: active && !stopped ? POLL_MS : false,
    gcTime: 0,
    queryFn: async (): Promise<{ counts: DemoProgressCounts; at: number }> => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const [statsRes, demoIdRes] = await Promise.all([
        supabase.rpc("get_user_stats", {
          user_timezone: timezone,
          include_read_only: true,
        }),
        supabase.rpc("get_demo_user_id" as never),
      ]);
      if (statsRes.error) throw statsRes.error;
      const rows = (statsRes.data as unknown as RawUserStats[]) ?? [];
      // Match the demo account by id: it may be temporarily unlocked mid-run,
      // so `is_read_only` is not a reliable identifier.
      const demoId = demoIdRes.data as unknown as string | null;
      const demo = rows.find((r) => r.user_id === demoId) ?? rows.find((r) => r.is_read_only);
      return {
        counts: {
          foodEntries: Number(demo?.total_entries ?? 0),
          weightSets: Number(demo?.total_weight_entries ?? 0),
          customLogEntries: Number(demo?.custom_log_entries_count ?? 0),
          savedMeals: Number(demo?.saved_meals_count ?? 0),
          savedRoutines: Number(demo?.saved_routines_count ?? 0),
        },
        at: Date.now(),
      };
    },
  });

  // Stop polling once counts go quiet, or after the safety cap.
  const counts = query.data?.counts;
  useEffect(() => {
    if (!active || stopped || !counts || startedAt === null) return;
    const signature = JSON.stringify(counts);
    const now = Date.now();
    if (signature !== lastSignature.current) {
      lastSignature.current = signature;
      lastChangeAt.current = now;
      return;
    }
    if (now - lastChangeAt.current > IDLE_STOP_MS || now - startedAt > MAX_RUN_MS) {
      setStopped(true);
    }
  }, [counts, active, stopped, startedAt]);

  const dismiss = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStartedAt(null);
    setStopped(false);
  }, []);

  return {
    counts,
    startedAt,
    updatedAt: query.data?.at,
    active,
    isPolling: active && !stopped,
    settled: stopped,
    error: query.error as Error | null,
    dismiss,
  };
}
