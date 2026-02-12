

## Two Fixes: Date Button Contrast + Shared Persistent Date

### Fix 1: Date text invisible in light theme

Both `FoodLog.tsx` and `WeightLog.tsx` hardcode `text-white` on the date picker button. This is invisible against a light background.

**Fix**: Replace `text-white` with `text-foreground` so it adapts to the current theme. Keep the underline styling. Also update the `decoration-white` to `decoration-foreground` so the underline matches.

**Files**: `src/pages/FoodLog.tsx` (line 714), `src/pages/WeightLog.tsx` (line 608)

### Fix 2: Persist selected date across page navigations

Currently, each page reads `?date=` from the URL. When the user navigates to another tab (e.g., Food to Exercise), the URL resets and the date goes back to today.

**Approach**: Store the selected date in `localStorage` under a key like `selectedDate`. When either page loads without a `?date=` param, check localStorage for a stored date. When the user changes the date (via arrows or calendar), write it to localStorage. When returning to "today", clear the stored value.

This is simpler and more reliable than a React context (which would lose state on refresh) and avoids URL coupling between routes.

**Implementation**:

1. Create a small shared utility `src/lib/selected-date.ts` with:
   - `getStoredDate(): string | null` -- reads from localStorage, returns null if it's in the future or invalid
   - `setStoredDate(dateStr: string): void` -- writes to localStorage (clears if it's today)

2. Update the wrapper components in both `FoodLog.tsx` and `WeightLog.tsx`:
   - When determining `dateKey`: check URL param first, then localStorage, then today
   - When navigating dates (arrows, calendar, "Go to Today"): call `setStoredDate` in addition to `setSearchParams`

3. Update `History.tsx` `handleDayClick`: also call `setStoredDate` so clicking a calendar day persists when landing on Food/Exercise

### Files Changed

| File | Change |
|------|--------|
| `src/pages/FoodLog.tsx` | Fix `text-white` to `text-foreground`; read/write stored date |
| `src/pages/WeightLog.tsx` | Fix `text-white` to `text-foreground`; read/write stored date |
| `src/lib/selected-date.ts` | Create -- `getStoredDate` / `setStoredDate` helpers |
| `src/pages/History.tsx` | Call `setStoredDate` on day click |
