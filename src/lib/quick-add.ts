/**
 * Quick Add selection logic.
 *
 * Domain-agnostic: given per-item usage over a rolling window plus the user's
 * manual pins/hides, decide which saved items deserve a one-tap chip.
 *
 * Used today by saved meals (food) and saved routines (exercise); a future
 * custom-log domain only needs to supply its own usage map.
 */

export const QUICK_ADD = {
  /** Rolling window (days) used to measure how habitual an item is. */
  WINDOW_DAYS: 30,
  /** Don't show the row at all until the user has this many active days. */
  MIN_ACTIVE_DAYS: 5,
  /** An item must appear on at least this many distinct days. */
  MIN_USED_DAYS: 3,
  /** ...and on at least this fraction of the user's active days. */
  ACTIVE_DAY_RATIO: 0.3,
  /** Auto-detected items must have been used within this many days to stay. */
  RECENT_DAYS: 10,
  /** Chips shown from automatic detection. */
  MAX_CHIPS: 4,
  /** Hard ceiling including manual pins. */
  MAX_CHIPS_WITH_PINS: 6,
} as const;

export interface QuickAddUsage {
  /** Distinct days in the window on which this item was logged. */
  usedDays: number;
  /** Most recent day (ISO date string) it was logged, if any. */
  lastUsedAt: string | null;
}

export interface QuickAddSelectionInput {
  /** Ids of saved items that still exist, in the caller's preferred base order. */
  availableIds: string[];
  usage: Map<string, QuickAddUsage>;
  /** Distinct days in the window with any logging in this domain. */
  activeDays: number;
  pinned?: string[];
  hidden?: string[];
  /** Items already logged on the viewed day — never offered again. */
  alreadyLoggedIds?: Iterable<string>;
  /** ISO date used as "now" for the recency guard. Defaults to today. */
  today?: string;
}

function byUsage(a: string, b: string, usage: Map<string, QuickAddUsage>): number {
  const ua = usage.get(a);
  const ub = usage.get(b);
  const daysDiff = (ub?.usedDays ?? 0) - (ua?.usedDays ?? 0);
  if (daysDiff !== 0) return daysDiff;
  return (ub?.lastUsedAt ?? '').localeCompare(ua?.lastUsedAt ?? '');
}

/** ISO date `days` before `from`, compared lexically (both are yyyy-MM-dd). */
function isoDaysBefore(from: string, days: number): string {
  const d = new Date(`${from}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns the ordered ids to render as Quick Add chips (may be empty).
 */
export function selectQuickAddIds({
  availableIds,
  usage,
  activeDays,
  pinned = [],
  hidden = [],
  alreadyLoggedIds,
  today,
}: QuickAddSelectionInput): string[] {
  const hiddenSet = new Set(hidden);
  const loggedSet = new Set(alreadyLoggedIds ?? []);
  const pinnedSet = new Set(pinned);

  const eligible = availableIds.filter((id) => !hiddenSet.has(id) && !loggedSet.has(id));
  if (eligible.length === 0) return [];

  const pinnedIds = eligible
    .filter((id) => pinnedSet.has(id))
    .sort((a, b) => byUsage(a, b, usage))
    .slice(0, QUICK_ADD.MAX_CHIPS_WITH_PINS);

  // Automatic detection only kicks in once there's a real pattern to detect.
  const threshold = Math.max(QUICK_ADD.MIN_USED_DAYS, QUICK_ADD.ACTIVE_DAY_RATIO * activeDays);
  // Habits change: an item that was frequent early in the window but has gone
  // quiet shouldn't keep occupying a row. Pins deliberately skip this check.
  const recencyCutoff = isoDaysBefore(
    today ?? new Date().toISOString().slice(0, 10),
    QUICK_ADD.RECENT_DAYS
  );
  const detected =
    activeDays >= QUICK_ADD.MIN_ACTIVE_DAYS
      ? eligible
          .filter((id) => {
            if (pinnedSet.has(id)) return false;
            const u = usage.get(id);
            if ((u?.usedDays ?? 0) < threshold) return false;
            return !!u?.lastUsedAt && u.lastUsedAt >= recencyCutoff;
          })
          .sort((a, b) => byUsage(a, b, usage))
      : [];

  const limit = Math.min(
    QUICK_ADD.MAX_CHIPS_WITH_PINS,
    Math.max(QUICK_ADD.MAX_CHIPS, pinnedIds.length)
  );

  return [...pinnedIds, ...detected].slice(0, limit);
}

/**
 * Build a usage map + active-day count from flat (date, itemId) rows.
 * `itemId` is null for rows that didn't come from a saved item — those still
 * count toward active days.
 */
export function buildQuickAddUsage(
  rows: { date: string; itemId: string | null }[]
): { usage: Map<string, QuickAddUsage>; activeDays: number } {
  const activeDates = new Set<string>();
  const daysByItem = new Map<string, Set<string>>();

  for (const row of rows) {
    if (!row.date) continue;
    activeDates.add(row.date);
    if (!row.itemId) continue;
    const set = daysByItem.get(row.itemId) ?? new Set<string>();
    set.add(row.date);
    daysByItem.set(row.itemId, set);
  }

  const usage = new Map<string, QuickAddUsage>();
  for (const [itemId, dates] of daysByItem) {
    usage.set(itemId, {
      usedDays: dates.size,
      lastUsedAt: [...dates].sort().pop() ?? null,
    });
  }

  return { usage, activeDays: activeDates.size };
}
