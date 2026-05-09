# Add Typeahead to Exercise Logging

## Goal

Surface inline "previously logged" suggestions in the exercise input — but limited to **saved routines only**, not raw historical exercises. The food typeahead infrastructure is already generic enough to reuse with zero changes; this is purely a wiring task in `WeightLog.tsx`.

## Why saved routines only (and not historical exercises)

You're right that matching against every past run/lift would be a poor experience:

- **Food has stable identity**: "Chipotle bowl" today is essentially the same as last week — copying the macros saves typing and is accurate.
- **Exercise has intentional variation**: every run differs in distance/pace/duration; every lift differs in weight/reps. Suggesting a past instance would either pre-fill stale numbers (wrong) or just match the name (no value over typing).
- **Saved routines are the user's own curation** — you've already decided "this pattern is worth reusing," and `use_count` / `last_used_at` tells us which ones matter.

So the rule: **typeahead = a faster path to your saved routines list**, not a history browser.

## Behavior

- User types in the exercise input. Once 3+ chars match a saved routine name (or its `original_input` / exercise descriptions), the same dropdown that appears in food logging shows up.
- Selecting a suggestion behaves identically to tapping that routine in `SavedRoutinesPopover`: clears the text, calls `handleLogSavedRoutine(exerciseSets, routineId)`, increments `use_count`, etc.
- Ranking uses the existing scoring (similarity × recency × frequency). `use_count` → `frequency`, `last_used_at ?? created_at` → `timestamp`. Routines you actually use float to the top.
- If no routines match, dropdown stays hidden — no fallback to historical exercises.

## Subtitle: lifting vs cardio paths

A routine is classified per-routine by inspecting its `exercise_sets`:

- **Cardio** if every set has `duration_minutes` and no meaningful `weight_lbs`.
- **Lifting** otherwise (mixed routines fall back to lifting since strength is usually the headline).

Then the subtitle picks one of four formats:

| Case | Subtitle |
|---|---|
| Lifting, single exercise | `3×8 · 135 lb` (sets×reps · weight, respects `settings.weightUnit`) |
| Lifting, multi exercise | `4 lifts · 12 sets` (distinct exercises · total set count) |
| Cardio, single exercise | `30 min · 3.0 mi` (drop the distance half if missing → just `30 min`; respects `settings.distanceUnit`) |
| Cardio, multi exercise | `2 cardio · 45 min` (count · total duration) |

Weight/distance unit conversion uses the existing helpers in `src/lib/weight-units.ts` so the rendered units match user preference (lb/kg, mi/km).

## What stays the same (shared architecture)

- `useTypeaheadSuggestions` hook — unchanged. Already generic over `TypeaheadCandidate`.
- `TypeaheadSuggestions` component — unchanged. Renders label/subtitle/timeAgo regardless of source.
- `LogInput` props (`typeaheadCandidates`, `onSelectTypeahead`) — already mode-agnostic.

This is exactly the shared-code architecture you wanted: the food log added the infrastructure, and exercise inherits it for free. The only new code is a small subtitle formatter for routines and the wiring in `WeightLog.tsx`.

## Implementation

1. **New helper** `src/lib/routine-subtitle.ts` (small, pure, testable):
   - `formatRoutineSubtitle(routine: SavedRoutine, opts: { weightUnit, distanceUnit }): string`
   - Implements the four-case table above.
   - Unit-tested for each branch (single/multi × lifting/cardio, missing distance, lb↔kg, mi↔km).

2. **Build candidates from `savedRoutines`** in `WeightLog.tsx` (mirrors the saved-meals branch in FoodLog):
   ```ts
   const typeaheadCandidates = useMemo((): TypeaheadCandidate[] | undefined => {
     if (!savedRoutines?.length) return undefined;
     return savedRoutines.map(r => ({
       id: `routine:${r.id}`,
       label: r.name,
       searchText: [r.name, r.original_input, ...r.exercise_sets.map(s => s.description)]
         .filter(Boolean).join(' '),
       subtitle: formatRoutineSubtitle(r, {
         weightUnit: settings.weightUnit,
         distanceUnit: settings.distanceUnit,
       }),
       timestamp: r.last_used_at ?? r.created_at,
       frequency: Math.max(1, r.use_count ?? 1),
       payload: r,
     }));
   }, [savedRoutines, settings.weightUnit, settings.distanceUnit]);
   ```

3. **Selection handler** — unwrap the routine and reuse the existing log path:
   ```ts
   const handleSelectTypeahead = useCallback((candidate: TypeaheadCandidate) => {
     const routine = candidate.payload as SavedRoutine;
     handleLogSavedRoutine(routine.exercise_sets, routine.id);
   }, [handleLogSavedRoutine]);
   ```

4. **Wire into `<LogInput>`** in WeightLog.tsx: pass `typeaheadCandidates` and `onSelectTypeahead`.

## Out of scope (deliberately)

- No matching against `weight_sets` history. If you later want, e.g., "match against the last instance of an exercise to pre-fill its starting weight," that's a different feature with different UX (probably an inline ghost suggestion on the exercise row, not the input dropdown).
- No changes to the food typeahead.
- No changes to shared hook/component code.
