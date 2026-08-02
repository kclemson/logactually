# Fix the demo Lock/Unlock button resetting on refresh

## What's wrong

The Lock/Unlock toggle does persist — the demo account is genuinely unlocked right now in the database. The bug is in how the Admin page *reads* the state back.

The lock indicator asks the database for "a profile whose read-only flag is on". When the demo account is unlocked, no profile matches, the query returns nothing, and the code falls back to showing "Locked". So the button always snaps back to "Locked" after a refresh, no matter the real state.

This also explains the missing demo-population progress panel: the progress reader identifies the demo account the same way (by "read-only = true"). With the demo unlocked, it finds no demo row and reports nothing useful.

## The fix

1. Add a small admin-only database function `get_demo_read_only()` that looks up the demo account by its account identity (same approach the existing demo beta toggle uses) and returns its true lock state.
2. Point the Admin page's lock indicator at that function instead of the "find any read-only profile" query, so it reflects reality on load.
3. Make the demo-population progress reader identify the demo account the same reliable way, so progress counts keep working while the demo is unlocked.

## Technical details

- New migration: `public.get_demo_read_only()` — `SECURITY DEFINER`, `STABLE`, `SET search_path = public`, guarded with `has_role(auth.uid(), 'admin')`, resolving the demo profile by joining `auth.users` on the demo email (mirrors `is_demo_beta()`). Grant `EXECUTE` to `authenticated`.
- `src/pages/Admin.tsx`: replace the `['demoReadOnly']` query body with `supabase.rpc('get_demo_read_only')`; keep the existing `setQueryData` optimistic write from `toggle_demo_read_only`.
- `src/hooks/useDemoPopulateProgress.ts`: stop selecting the demo row via `rows.find(r => r.is_read_only)`. Instead resolve the demo user id once (small admin RPC or an added id field) and match on it, so counts still render when the demo account is unlocked.
