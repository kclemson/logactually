# Fix demo populate progress + move it onto the Admin page

## Why no progress appeared

The progress hook asks the admin stats function for every user and then picks the demo account by looking for the row flagged read-only. The demo account's read-only flag is currently switched **off**, so no row matched and the counts block never rendered — it stayed on "Checking current totals…" regardless of how long the job ran.

## Fix

1. Identify the demo account explicitly instead of guessing from the read-only flag.
   - Add an admin-only database function that returns the demo account's current row totals (food entries, exercise sets, custom log entries, saved meals, saved routines, bloodwork panels), resolving the demo user by its account email.
   - Point the progress hook at that function. It no longer depends on the read-only toggle and returns one small row instead of stats for every user.

2. Move the progress display out of the dialog.
   - Render a compact "Demo data population" progress block directly under the **Populate Demo Data** button on the Admin page.
   - It shows the live counts, a last-checked time, and a "counts stopped changing — likely finished" state, exactly as today.
   - Closing the dialog no longer hides it. The dialog keeps only the short "Started — running in background, see progress on the Admin page" confirmation.

3. Keep it alive across dialog close and page reload.
   - The Admin page owns the run state; the dialog reports "started" up to it.
   - The run's start time is stored in localStorage, so reloading the Admin page while a job is running resumes polling (it stops on the same idle/cap rules: quiet for 60s, or 15-minute cap), with a manual dismiss control.

## Technical notes

- Migration: `public.get_demo_progress_counts()` — `SECURITY DEFINER`, `SET search_path = public`, raises unless `has_role(auth.uid(), 'admin')`, returns json of counts for the profile joined to `auth.users` where email = `demo@logactually.com`. Grant execute to `authenticated`.
- `src/hooks/useDemoPopulateProgress.ts`: call the new RPC, drop the `is_read_only` row lookup, add `bloodworkPanels`, add localStorage-backed start time and a `dismiss()`.
- New `src/components/DemoPopulateProgress.tsx` rendering the counts block; used by `src/pages/Admin.tsx` below the button.
- `src/components/PopulateDemoDataDialog.tsx`: remove the progress UI and hook usage; add an `onStarted` callback fired when the function returns `status: 'processing'`.
