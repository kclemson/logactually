

# Explicit two-column layout for exercise detail fields

## What stays the same (all existing styling preserved)

Every per-field rendering detail is untouched:
- `w-12` for number inputs
- `w-[7.5rem]` for select dropdowns
- `min-w-[5rem]` label widths via `labelClassName`
- `pl-2` padding on view-mode values
- `mi/km` and `lbs/kg` unit toggles (UnitToggle component)
- `autoComplete="off"` on all inputs
- `h-6` compact input heights
- `flex-1 min-w-0` for text inputs
- `hideWhenZero` filtering logic

None of these are touched because they live inside the per-field rendering loop, which stays identical.

## What changes

### 1. New `FieldLayout` type (~line 18)

```typescript
interface FieldLayout {
  fullWidth: FieldConfig[];  // Name (spans both columns)
  left: FieldConfig[];       // Metrics column
  right: FieldConfig[];      // Classification column
}
```

### 2. `DetailDialogProps` accepts `FieldLayout | FieldConfig[]`

The `fields` prop and `buildFields` callback accept either format. A helper normalizes flat arrays into `FieldLayout` with all fields in the left column (backward compatible for food fields).

### 3. `FieldViewGrid` and `FieldEditGrid` rendering structure

Replace the single auto-flow grid with:

```
[full-width fields — col-span-2 as today]
<div class="grid grid-cols-2 gap-x-4">
  <div class="flex flex-col gap-y-1">
    {left.map(field => EXACT SAME per-field rendering)}
  </div>
  <div class="flex flex-col gap-y-1">
    {right.map(field => EXACT SAME per-field rendering)}
  </div>
</div>
```

The inner field rendering (label + input/value + unit toggle) is extracted into a shared helper so there is zero duplication and zero risk of styling drift between columns.

### 4. `buildExerciseDetailFields` returns `FieldLayout`

**Cardio:**
- fullWidth: Name
- left: Duration, Distance, Cal Burned, Heart Rate, Effort, Speed
- right: Category, Exercise type, Subtype, Incline, Cadence

**Strength:**
- fullWidth: Name
- left: Sets, Reps, Weight, Cal Burned, Heart Rate, Effort
- right: Category, Exercise type, Subtype

**Other:**
- fullWidth: Name
- left: Cal Burned, Heart Rate, Effort
- right: Category

### 5. `buildFoodDetailFields` (if it exists) stays as flat array

The normalization helper wraps it into a `FieldLayout` automatically, so food dialogs render exactly as they do today with no changes needed.

## Files changed
- `src/components/DetailDialog.tsx` only

