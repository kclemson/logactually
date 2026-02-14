

## Fix AI Prompt to Handle mm:ss Duration Format

Update `supabase/functions/_shared/prompts.ts` to teach the AI model how to parse common duration formats like "12:30" (12 min 30 sec = 12.5 minutes).

### Technical Details

Two lines need updating (one per prompt version):

- **Line 148** (default prompt): Change `duration_minutes` description from:
  ```
  - duration_minutes: duration in minutes (number), if relevant
  ```
  to:
  ```
  - duration_minutes: duration in minutes (number), if relevant. Parse "mm:ss" as minutes:seconds (e.g., "12:30" = 12.5 minutes) and "h:mm:ss" as hours (e.g., "1:15:00" = 75 minutes).
  ```

- **Line 214** (experimental prompt): Same change.

One file changed: `supabase/functions/_shared/prompts.ts` (lines 148 and 214).

