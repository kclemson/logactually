

# Fix: Exercise entry counts in calorie burn tooltip

## Problem
The tooltip shows "2 cardio" for Feb 16 when there were actually 3 cardio entries (2 dog walks + 1 treadmill run), and "2 cardio" for Feb 15 when there were 5 (3 dog walks + 2 biking). This happens because `useWeightTrends` aggregates multiple entries of the same exercise type on the same date into a single data point. The counting logic in `useDailyCalorieBurn` uses a Set of unique exercise keys, which can only count distinct types, not individual entries.

## Solution
Add an `entryCount` field to each aggregated data point in `useWeightTrends`, then sum those counts in `useDailyCalorieBurn` instead of counting unique keys.

## Files to change

### 1. `src/hooks/useWeightTrends.ts`
- Add `entryCount: number` to the `WeightPoint` interface
- Initialize it to `1` when creating a new data point (line 117)
- Increment it when merging entries (inside the `if (existing)` block, around line 92)

### 2. `src/hooks/useDailyCalorieBurn.ts`
- Replace the `Set<string>` approach with simple counters
- For each data point, determine if the exercise is cardio or strength, then add `point.entryCount` (or default to 1) to the appropriate counter
- Remove the Set-based counting and the post-processing loop that iterated over keys
- Sum `exerciseCount` as `cardioCount + strengthCount`

### Expected results after fix
- Feb 16: 2 dog walks (merged into 1 walking point with entryCount=2) + 1 treadmill (entryCount=1) = **3 cardio**
- Feb 15: 3 dog walks (entryCount=3) + 2 biking entries (entryCount=2, or 1+1 if indoor/outdoor split) = **5 cardio**

