# Quick Add: threshold review + clearer menu labels

## Current math (recap)

Per domain, over a rolling **30-day** window:

- `activeDays` = distinct days with any logging in that domain.
- `usedDays(item)` = distinct days that saved item was logged.
- Automatic detection turns on only when `activeDays >= 5`.
- An item qualifies when `usedDays >= max(3, 0.30 * activeDays)`.
- Ranked by `usedDays`, then most-recent use. Max **4** auto rows, hard ceiling **6** including pins.
- Pins always show (bypass all thresholds); hidden items and items already logged that day are excluded.

Against your real data (31 active food days, so the bar is ~10 days): Quest bar 25, Coffee 24, Strawberries+Chobani 21, strawberries/yogurt/chia 16, Barebell bar 12 all qualify — the cap trims it to the top 4. Next candidate is 6 days, comfortably below the bar.

## Assessment

The approach is sound. Ratio-based (rather than raw count) is the right call because it self-adjusts for light vs. heavy loggers, and the `MIN_USED_DAYS = 3` floor stops a brand-new user with 5 active days from getting noise. Two refinements worth making:

1. **Add a recency guard.** Today an item logged 12 of the first 15 days and never since still ranks above something logged 9 of the last 10. Require the item to have been used at least once in the last 10 days to qualify automatically (pins unaffected). This is what keeps the list feeling current when habits change.
2. **Leave the ratio and caps alone.** 30% / 4 rows matches the data well and the row is intentionally short.

## Changes

**`src/lib/quick-add.ts`**
- Add `RECENT_DAYS: 10` to the `QUICK_ADD` config.
- `selectQuickAddIds` takes an optional `today` (ISO date, defaults to now) and drops auto-detected items whose `lastUsedAt` is older than `RECENT_DAYS`. Pinned items skip this check.

**`src/lib/quick-add.test.ts`**
- Add cases: stale-but-frequent item excluded; recently used item retained; pinned stale item still shown.

**`src/components/QuickAddGhostRows.tsx`**
- Rename the menu items so the scope is obvious:
  - "Hide this" → **"Remove from Quick Add"**
  - "Always show" / "Unpin" → **"Always show here"** / **"Stop always showing"**
  - "Turn off Quick Add" → **"Turn off Quick Add everywhere"**

No schema, hook, or settings changes.
