

# Two small changes to CalorieTargetDialog

## 1. Reorder mode options

In `src/lib/calorie-target.ts`, swap the order of the `TARGET_MODE_OPTIONS` array so it reads:
1. Fixed number (static)
2. Exercise adjusted (exercise_adjusted)
3. Estimated burn rate minus a deficit (body_stats)

Currently body_stats is second and exercise_adjusted is third -- just swap those two entries.

## 2. Skip today when finding the example day

In `src/components/CalorieTargetDialog.tsx`, the `exampleData` memo iterates `dailyFoodData` (sorted descending) and picks the first date that has both food and exercise data. Update this loop to skip today's date so the example always uses a completed day.

Add a `const todayStr = format(new Date(), 'yyyy-MM-dd')` and add `if (food.date === todayStr) continue;` at the top of the loop.

## Technical details

**File: `src/lib/calorie-target.ts` (lines 42-44)**

Reorder the array entries:
```ts
{ value: 'static', label: 'Fixed number', description: 'You set a specific calorie target' },
{ value: 'exercise_adjusted', label: 'Exercise adjusted', description: 'Logged exercise offsets your food intake' },
{ value: 'body_stats', label: 'Estimated burn rate minus a deficit', description: 'Calculated from your activity level, weight, and height' },
```

**File: `src/components/CalorieTargetDialog.tsx` (inside `exampleData` memo, ~line 65-66)**

Add today-skip logic:
```ts
const todayStr = format(new Date(), 'yyyy-MM-dd');

for (const food of dailyFoodData) {
  if (food.date === todayStr) continue;
  // ... rest unchanged
}
```

No other files affected.
