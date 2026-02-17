
# Fix Exercise Type Dropdown: Add Grouping and Better Display Names

## Problem

Two issues with the Exercise Type dropdown in the Detail Dialog:

1. **Overwhelming flat list** -- 70+ exercises in one dropdown with no organization. Users have to scroll through everything to find what they want.
2. **Awkward display names** -- The auto-generated names from snake_case keys produce unnatural results like "Walk Run", "T Bar Row", "Shoulder Press Machine". The Title Case On Every Word feels robotic.

## Solution

### 1. Add a display name registry to `exercise-metadata.ts`

Instead of auto-generating labels from keys, add an explicit `EXERCISE_DISPLAY_NAMES` map with human-written names. This gives us full control over natural phrasing:

```
bench_press      -> "Bench press"
walk_run         -> "Walk/run"
t_bar_row        -> "T-bar row"
chest_press_machine -> "Chest press (machine)"
assisted_dip_machine -> "Assisted dips (machine)"
bulgarian_split_squat -> "Bulgarian split squat"
```

Rules:
- Sentence case (capitalize first word only), not Title Case
- Use "/" for compound activities: "Walk/run"
- Use parenthetical for machine variants: "Bench press (machine)" instead of "Bench Press Machine"
- Keep it concise

### 2. Group the dropdown by category using `<optgroup>`

Replace the flat `<select>` with grouped options using the existing comment categories in `EXERCISE_MUSCLE_GROUPS`:

- **Upper body -- push**: bench_press through dips
- **Upper body -- pull**: lat_pulldown through shrugs
- **Lower body**: squat through step_up
- **Compound/full body**: deadlift through kettlebell_swing
- **Core**: cable_crunch through crunch
- **Machines**: chest_press_machine through assisted_pullup_machine
- **Cardio**: walk_run through jump_rope
- **Other**: functional_strength, other

Add a `group` field to each exercise entry (or a parallel `EXERCISE_GROUPS` ordered array) so the dropdown renders `<optgroup label="Upper body -- push">` sections.

### 3. Implementation details

**File: `src/lib/exercise-metadata.ts`**

Add two new exports:

```typescript
// Human-friendly display names (sentence case, natural phrasing)
export const EXERCISE_DISPLAY_NAMES: Record<string, string> = {
  bench_press: 'Bench press',
  incline_bench_press: 'Incline bench press',
  // ... all ~70 exercises
  walk_run: 'Walk/run',
  // ...
};

// Ordered groups for dropdown rendering
export const EXERCISE_GROUPS: { label: string; keys: string[] }[] = [
  { label: 'Upper body -- push', keys: ['bench_press', 'incline_bench_press', ...] },
  { label: 'Upper body -- pull', keys: ['lat_pulldown', 'pull_up', ...] },
  { label: 'Lower body', keys: ['squat', 'front_squat', ...] },
  { label: 'Compound', keys: ['deadlift', 'sumo_deadlift', ...] },
  { label: 'Core', keys: ['cable_crunch', 'hanging_leg_raise', ...] },
  { label: 'Machines', keys: ['chest_press_machine', ...] },
  { label: 'Cardio', keys: ['walk_run', 'cycling', ...] },
  { label: 'Other', keys: ['functional_strength'] },
];

// Helper to get display name with fallback
export function getExerciseDisplayName(key: string): string {
  return EXERCISE_DISPLAY_NAMES[key] || key.replace(/_/g, ' ');
}
```

**File: `src/components/DetailDialog.tsx`**

Update `buildExerciseKeyOptions()` to return grouped options, and update the `<select>` rendering for exercise_key to use `<optgroup>`:

```tsx
// The select element for exercise_key will render:
<select ...>
  <option value="">--</option>
  <optgroup label="Upper body -- push">
    <option value="bench_press">Bench press</option>
    <option value="incline_bench_press">Incline bench press</option>
    ...
  </optgroup>
  <optgroup label="Cardio">
    <option value="walk_run">Walk/run</option>
    ...
  </optgroup>
  <option value="other">Other</option>
</select>
```

This requires a small change to the `FieldConfig` type to support grouped options, or we handle it as a special case for the exercise_key field. The simplest approach: add an optional `optgroups` field to `FieldConfig`:

```typescript
interface FieldConfig {
  // ... existing fields
  optgroups?: { label: string; options: { value: string; label: string }[] }[];
}
```

When `optgroups` is present, the select renderer uses `<optgroup>` tags instead of flat `<option>` tags.

**Also update**: the `displayValue` function and view-mode rendering should use `getExerciseDisplayName()` so the read-only view also shows the friendly name.

## Summary of changes

| File | Change |
|------|--------|
| `src/lib/exercise-metadata.ts` | Add `EXERCISE_DISPLAY_NAMES`, `EXERCISE_GROUPS`, `getExerciseDisplayName()` |
| `src/components/DetailDialog.tsx` | Add `optgroups` to `FieldConfig`, update select rendering to use `<optgroup>`, update `buildExerciseKeyOptions()` to return grouped options |
