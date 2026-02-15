

# Calorie Target Dialog Polish: 7 Fixes

## Summary

Seven UI refinements to the CalorieTargetDialog and BiometricsInputs components addressing clipping, layout, text, and conditional display issues.

---

## Changes

### 1. `src/components/CalorieTargetDialog.tsx` -- Fix focus ring clipping on mode dropdown

The `SelectTrigger` is inside a container that may clip the focus ring. Add `overflow-visible` or slight padding to the parent, and widen the trigger.

**Line 144**: Change `w-[200px]` to `w-[240px]` on the SelectTrigger (also fixes issue #2 -- prevents text wrapping).

Add a small right padding or `overflow-visible` on the parent flex container (line 138) to prevent the focus ring from being clipped.

### 2. `src/components/CalorieTargetDialog.tsx` -- Widen mode dropdown

Covered by #1 above -- increasing from `w-[200px]` to `w-[240px]` gives enough room for all three labels + descriptions to render without wrapping.

### 3. `src/components/BiometricsInputs.tsx` -- Conditionally show effect subtexts

Add a new prop `showEffectHints?: boolean` (default `true`). When `false`, hide the "Largest effect (~30-50%)", "Moderate effect (~10-15%)", "Small effect (~5% per decade)", and "Moderate effect (~5-10%)" subtitle lines.

- `CalorieBurnDialog.tsx` passes nothing (defaults to `true`) -- subtexts still show.
- `CalorieTargetDialog.tsx` passes `showEffectHints={false}` -- subtexts hidden.

### 4. `src/components/CalorieTargetDialog.tsx` -- Remove calorieBurnEnabled warning

Remove lines 265-268 (the amber warning about enabling "Show estimated calorie burn"). The exercise-adjusted mode works independently as long as biometric data is entered here. The calorie burn toggle only controls whether burn estimates appear on the Exercise Log tab -- it's not a dependency for the target calculation.

### 5. `src/components/BiometricsInputs.tsx` -- Add "years" unit next to Age

Replace the empty `<span className="w-8" />` spacer (line 232) with a styled "years" label using the same selected-unit styling as lbs/kg and ft/cm:

```
<span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-foreground font-medium">years</span>
```

### 6. `src/components/CalorieTargetDialog.tsx` -- Move activity level above biometrics

In the `body_stats` mode section (lines 180-237), reorder so that the activity level dropdown + activity hint appear immediately after the mode dropdown, before `BiometricsInputs`. Current order: BiometricsInputs, Activity level, Activity hint, Daily deficit, Summary. New order: Activity level, Activity hint, BiometricsInputs, Daily deficit, Summary.

### 7. `src/lib/calorie-target.ts` -- Update description text

Change line 43 from:
`'Calculated from your weight, height, and activity level'`
to:
`'Calculated from your activity level, weight, and height'`

---

## File Change Summary

| File | Changes |
|---|---|
| `src/components/BiometricsInputs.tsx` | Add `showEffectHints` prop; conditionally render subtexts; replace Age spacer with "years" label |
| `src/components/CalorieTargetDialog.tsx` | Widen SelectTrigger + fix focus clipping; pass `showEffectHints={false}`; reorder activity level above biometrics; remove calorieBurnEnabled warning |
| `src/lib/calorie-target.ts` | Reword body_stats description to "activity level, weight, and height" |

