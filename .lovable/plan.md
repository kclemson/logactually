

# Suppress save-suggestion prompt after "Copy to today"

## Problem
When you tap "Copy to today" on a past food entry, it calls `createEntryFromItems` which runs the repeated-entry detection check. If the copied meal has been logged before, you immediately see a "Save as meal?" prompt on today's page -- confusing since you just explicitly copied something.

## Scope
This only affects **FoodLog.tsx**. The WeightLog copy handler already bypasses the suggestion check because it calls `createEntry.mutateAsync` directly instead of going through the shared helper.

## Change

### `src/pages/FoodLog.tsx`

1. Add an optional `skipSuggestionCheck?: boolean` parameter to `createEntryFromItems` (after `targetDate`).
2. Guard the repeated-entry detection block (line 247) with `&& !skipSuggestionCheck`.
3. In `handleCopyEntryToToday`, pass `true` for `skipSuggestionCheck`.

That's it -- one file, three small edits.
