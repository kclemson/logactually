

# Consolidate Cycling Charts on Trends Page

## Problem
When logging cycling, the AI correctly assigns `exercise_key: cycling` but may or may not assign `exercise_subtype` (e.g., "indoor" vs null). The trends aggregation groups by `exercise_key::subtype`, producing two separate charts ("Indoor bike" and "Cycling") for what is effectively the same activity.

Unlike walk_run -- where walking, running, and hiking are genuinely different activities worth separate charts -- indoor vs outdoor cycling is not a meaningful distinction for trending.

## Solution
Only split charts by subtype for `walk_run`. For all other cardio exercises (cycling, swimming, etc.), ignore the subtype when building the trends map key so all sessions consolidate into one chart.

## Technical Details

**File: `src/hooks/useWeightTrends.ts`** (line 57)

Change the map key logic from always including subtype:
```typescript
const mapKey = subtype ? `${exerciseKey}::${subtype}` : exerciseKey;
```
To only splitting on subtype for walk_run:
```typescript
const shouldSplitBySubtype = exerciseKey === 'walk_run';
const mapKey = shouldSplitBySubtype && subtype ? `${exerciseKey}::${subtype}` : exerciseKey;
```

This means:
- `walk_run::walking`, `walk_run::running`, `walk_run::hiking` remain separate charts (desired)
- `cycling::indoor` and `cycling` (outdoor/unspecified) merge into one "Cycling" chart
- `swimming::pool` and `swimming::open_water` merge into one "Swimming" chart
- All other exercises unaffected (they rarely have subtypes)

**Additionally**, fix the existing "Indoor bike" data: update the one row that has a null subtype to `indoor`, so the description is consistent. Run a small migration or just let the next log naturally use the right subtype -- the chart consolidation handles it either way with no data fix needed.

No new files, no new dependencies.
