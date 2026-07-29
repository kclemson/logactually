## Problem

The relative activity floor is being computed against the single global max session count across all exercises. Cardio entries like Walking dominate that max (likely 300+ sessions in your account), so `sessionFloor = ceil(300 * 0.1) = 30`. Any strength exercise done fewer than 30 times gets filtered out — that's why you're only seeing 7 charts and "Show more" is gone (the entire qualified pool now fits under the initial visible count).

The 10% rule was meant to hide the long tail *within a comparable group*, not to make cardio's frequency invalidate strength progress.

## Fix

Split the relative floor calculation by exercise type so cardio and strength don't distort each other:

- In `src/pages/Trends.tsx`, change `qualifiedExercises` to:
  1. Classify each exercise as cardio vs strength (same rule already used: `maxWeight === 0 && (maxDuration > 0 || maxDistance > 0)`).
  2. Compute `maxSessionCount` **separately** for the cardio bucket and the strength bucket.
  3. Apply `sessionFloor = max(3, ceil(bucketMax * 0.1))` **within each bucket**.
  4. Keep the existing rules: min 3 sessions; drop non-cardio with `maxWeight === 0`.

Nothing else changes — `exercisePool`, `visibleExercises`, `hasMoreExercises`, and the "Show more" button all derive from `qualifiedExercises` and will start populating correctly again.

## Verification

- Typecheck + existing tests.
- No unit test currently covers `qualifiedExercises`; the change is small and localized to one `useMemo`.
