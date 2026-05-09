## Problem

Typing "leg" in the weight log surfaces the "Kettlebell at home" saved routine because its `original_input` ("25lb kettlebell step ups 3 sets of 8 for each **leg**") gets fed into the typeahead's `searchText`. The matcher uses prefix containment, so "leg" → matches "leg" → the routine ranks. Confirmed against the DB.

## Fix

In `src/pages/WeightLog.tsx` (around line 409), build the routine's `searchText` from only the structured fields:

```ts
searchText: [r.name, ...r.exercise_sets.map(s => s.description)]
  .filter(Boolean)
  .join(' '),
```

Remove `r.original_input` from the join. Exercise descriptions already carry the real keywords ("Bench Press", "Romanian Deadlift", etc.), so recall stays high; we just stop matching against incidental words like "for each leg", "today", "felt heavy".

## Out of scope

- Saved-meals typeahead in `FoodLog.tsx` — meals' `original_input` is more useful for recall (e.g. "PB&J on sourdough" never made it into a structured description) and hasn't shown a similar false-match. Leave untouched.
- The similarity scoring itself in `text-similarity.ts` — the matcher is doing what it's told; the input is the issue.
- Stop-word lists or exercise-specific noise filtering.

## Verification

Manual: type "leg" in the weight log on a routine list that includes "Kettlebell at home"; it should no longer appear. "Leg Press" / "Leg Curl" history-derived candidates (which come from descriptions) should still match.
