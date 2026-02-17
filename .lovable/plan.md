

# Exercise-Adjusted Mode: Equation Tooltips

## What this changes

Currently, when the user's calorie target mode is "exercise adjusted", both the daily and rollup tooltips fall through to a simple text fallback (e.g., `1,666 / 1,800 cal target (incl. 300 burn)`). This change adds a structured math equation -- matching the style already used for `body_stats + logged` mode -- so users can see exactly how their adjusted target is calculated from their live data.

## The math being shown

**Daily tooltip (per calendar cell):**
```text
1,500  (daily calorie target)
+ 300  (calories burned from exercise)
---------
1,800  adjusted daily calorie target
```

**Rollup tooltip (7-day / 30-day averages):**
```text
1,500  (daily calorie target)
+ 285  (avg calories burned last 7 days)
---------
1,785  average adjusted target
```

If the user had zero exercise burns on a given day, the `+ 0` row still appears so the equation is consistent and educational.

## Technical approach

### File: `src/lib/calorie-target.ts`

Extend `getCalorieTargetComponents` to also return structured data for `exercise_adjusted` mode. Add a new variant to the return type:

```typescript
export interface CalorieTargetComponents {
  tdee: number;
  deficit: number;
  mode: 'body_stats_logged' | 'exercise_adjusted';
  baseTarget?: number; // used for exercise_adjusted
}
```

For `exercise_adjusted` mode, return `{ tdee: 0, deficit: 0, mode: 'exercise_adjusted', baseTarget: dailyCalorieTarget }`. Using a `mode` discriminator lets the tooltip code render the right labels.

### File: `src/pages/History.tsx` (buildDayTooltip)

When `targetComponents.mode === 'exercise_adjusted'`, render a two-row equation grid:
- Row 1: `baseTarget` with label "(daily calorie target)"
- Row 2: `+ burn` with label "(calories burned from exercise)"
- Divider + result: `target` adjusted daily calorie target

The existing `body_stats_logged` branch continues to show TDEE / burn / deficit as before.

### File: `src/components/CalorieTargetRollup.tsx`

Update `renderEquationBlock` to handle the `exercise_adjusted` mode. When components.mode is `exercise_adjusted`:
- Row 1: `baseTarget` with label "(daily calorie target)"
- Row 2: `+ avgBurn` with label "(avg calories burned last N days)"
- No deficit row

The existing body_stats_logged rendering is unchanged.

### Files changed
- `src/lib/calorie-target.ts`
- `src/pages/History.tsx`
- `src/components/CalorieTargetRollup.tsx`
