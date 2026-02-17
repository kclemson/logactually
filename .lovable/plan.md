

# Fix calorie-target test: body_stats with fixed activity level

## The Bug
The test `'returns null for body_stats with fixed activity level'` in `src/lib/calorie-target.test.ts` (line 393-396) expects `getCalorieTargetComponents()` to return `null` when given `body_stats` mode with a fixed activity level like `'light'`.

But the actual implementation in `getCalorieTargetComponents()` (calorie-target.ts, lines 242-244) correctly handles this case by computing `TDEE = BMR x activity_multiplier` and returning `{ tdee, deficit, mode: 'body_stats_multiplier' }`.

The test expectation is simply wrong -- the function works as designed.

## Fix
Update the test at lines 393-396 to assert a non-null result with the correct shape:

```typescript
it('returns body_stats_multiplier for body_stats with fixed activity level', () => {
  const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'light' as const };
  const result = getCalorieTargetComponents(s);
  expect(result).not.toBeNull();
  expect(result!.mode).toBe('body_stats_multiplier');
  expect(result!.tdee).toBeGreaterThan(1000);
  expect(result!.deficit).toBe(0);
});
```

Single file change, single test case.

