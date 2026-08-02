# Definitive Demo Population Completion Signal

## Problem
The Admin page currently guesses whether a `populate-demo-data` run is finished by polling row counts and waiting for them to stop changing for 60 seconds. It shows "likely finished," which is a heuristic, not a real completion signal. The edge function could still be running, paused, or failed, and the UI has no way to know.

## Goal
Make the edge function report its own run state, and update the Admin UI to display a definitive status.

## Proposed Changes

### Backend
1. Add a small status table `public.demo_populate_status` with columns:
   - `id` (uuid primary key)
   - `started_at` (timestamptz)
   - `completed_at` (timestamptz, nullable)
   - `status` (text: 'running' | 'completed' | 'failed')
   - `error_message` (text, nullable)
   - `counts_snapshot` (jsonb, nullable)
2. Include the required `GRANT` statements for `service_role` (edge function) and `authenticated` (admin RPC readers).
3. Update `supabase/functions/populate-demo-data/index.ts`:
   - At the start of a run, insert a `running` row.
   - When `doPopulationWork` finishes, update the row to `completed` with a counts snapshot.
   - On failure, update the row to `failed` with `error_message`.
4. Add an admin-only RPC `get_demo_populate_status()` that returns the latest row.

### Frontend
1. Update `src/hooks/useDemoPopulateProgress.ts` to read from `get_demo_populate_status()` in addition to (or instead of) the idle-count heuristic.
2. Update `src/components/DemoPopulateProgress.tsx` to show:
   - "Running" while status is `running`
   - "Done" with a timestamp when status is `completed`
   - "Failed: <message>" when status is `failed`
3. Keep the existing idle-count fallback as a secondary guard so the UI still settles if the edge function fails to write status.

## Acceptance Criteria
- Starting a new populate run creates a visible `running` status on `/admin` immediately.
- When the run finishes, the banner changes to a clear "Done" state with the completion time.
- If the run fails, the banner shows "Failed" with the error message.
- Running a second populate while one is `running` is blocked or clearly warned (optional but recommended).
