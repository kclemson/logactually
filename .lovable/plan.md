# Move demo populate progress onto the Admin page

## Why no progress appeared

The progress hook picks the demo account out of the admin stats by looking for the row flagged read-only. That flag was temporarily off during the last run, so no row matched and the counts block never rendered. The flag is back on, so identification works as-is — no change needed there.

## What to change

Move the progress display out of the dialog so it survives closing it.

- Render a compact "Demo data population" progress block directly under the **Populate Demo Data** button on the Admin page: live counts, last-checked time, and the "counts stopped changing — likely finished" state, exactly as today.
- The dialog keeps only a short confirmation ("Started — running in the background, progress shows on the Admin page") and no longer renders counts.
- The Admin page owns the run state; the dialog reports "started" up to it when the function returns `status: 'processing'`.
- Persist the run's start time in localStorage so reloading the Admin page mid-run resumes polling, with the same stop rules (quiet for 60s, or a 15-minute cap) plus a manual dismiss control.

## Technical notes

- New `src/components/DemoPopulateProgress.tsx` renders the counts block and owns `useDemoPopulateProgress`; used by `src/pages/Admin.tsx` below the button.
- `src/hooks/useDemoPopulateProgress.ts`: keep the read-only row lookup; add localStorage-backed start time so a reload resumes, and a `dismiss()`.
- `src/components/PopulateDemoDataDialog.tsx`: remove the progress UI and hook usage; add an `onStarted` callback.
- No database or edge-function changes.
