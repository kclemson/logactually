# Live progress for demo data population

## Goal
While "Populate Demo Data" runs in the background, show counts climbing in the dialog instead of a static "Processing in background" message.

## Approach (no backend changes)
The admin-only `get_user_stats` function already returns, per user, the totals we care about: food entries, exercise entries, custom log entries, saved meals, and saved routines. It accepts an `include_read_only` flag, so the demo account's row can be requested directly.

Once the population job starts, the dialog polls that function every ~3 seconds and displays the demo account's current totals. Because the job writes rows as it goes, the numbers tick upward and give a real sense of progress.

## What the user sees
- After pressing Populate, the result box switches to a live panel:
  - "Working in the background - counts update as data is written"
  - Rows for Food, Exercise, Custom logs, Saved meals, Saved routines with current totals
  - A "last updated" timestamp so it's obvious polling is alive
- Polling stops when the dialog closes, or after all counts stop changing for ~60 seconds (treated as finished), or after a 15-minute cap.
- The panel does not claim completion percentage; it reports observed counts only.

## Technical notes
- New hook `src/hooks/useDemoPopulateProgress.ts`: react-query with `refetchInterval`, calling `supabase.rpc('get_user_stats', { user_timezone, include_read_only: true })` and selecting the row where `is_read_only` is true.
- `src/components/PopulateDemoDataDialog.tsx`: when `result.status === 'processing'`, render the live panel driven by that hook; enable the hook only in that state.
- Note: with "Clear existing data" checked, counts start near zero and grow; without it, they start at the current totals, so the panel shows absolute totals rather than a delta.

## Not included
Fine-grained phase reporting ("parsing food with AI", "generating bloodwork") would require the edge function to persist a progress record and a place to read it from. Say the word if that level of detail is wanted instead.
