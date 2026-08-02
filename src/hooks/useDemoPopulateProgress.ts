import { useEffect, useRef, useState } from "react";
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

interface RawUserStats {
  is_read_only: boolean;
  total_entries: number;
  total_weight_entries: number;
  custom_log_entries_count: number;
  saved_meals_count: number;
  saved_routines_count: number;
}

/**
 * Polls the admin user-stats function for the demo account's row totals so the
 * populate dialog can show progress while the edge function runs in background.
 */
export function useDemoPopulateProgress(enabled: boolean) {
  const [stopped, setStopped] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const lastChangeAt = useRef<number>(Date.now());
  const lastSignature = useRef<string>("");

  // Reset the timers whenever a new run begins.
  useEffect(() => {
    if (enabled) {
      startedAt.current = Date.now();
      lastChangeAt.current = Date.now();
      lastSignature.current = "";
      setStopped(false);
    }
  }, [enabled]);

  const query = useQuery({
    queryKey: ["demo-populate-progress"],
    enabled: enabled && !stopped,
    refetchInterval: enabled && !stopped ? POLL_MS : false,
    gcTime: 0,
    queryFn: async (): Promise<{ counts: DemoProgressCounts; at: number }> => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { data, error } = await supabase.rpc("get_user_stats", {
        user_timezone: timezone,
        include_read_only: true,
      });
      if (error) throw error;
      const rows = (data as unknown as RawUserStats[]) ?? [];
      const demo = rows.find((r) => r.is_read_only);
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
    if (!enabled || stopped || !counts) return;
    const signature = JSON.stringify(counts);
    const now = Date.now();
    if (signature !== lastSignature.current) {
      lastSignature.current = signature;
      lastChangeAt.current = now;
      return;
    }
    if (now - lastChangeAt.current > IDLE_STOP_MS || now - startedAt.current > MAX_RUN_MS) {
      setStopped(true);
    }
  }, [counts, enabled, stopped]);

  return {
    counts,
    updatedAt: query.data?.at,
    isPolling: enabled && !stopped,
    settled: stopped,
  };
}
