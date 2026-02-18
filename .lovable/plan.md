

# Four improvements: unit labels, view/edit jitter, unit alignment, and category filter

## 1. Descriptive unit labels in Settings dropdowns

In `src/components/settings/PreferencesSection.tsx`, update the dropdown labels:
- "Lbs" -> "Pounds (lbs)", "Kg" -> "Kilograms (kg)"
- "Mi" -> "Miles (mi)", "Km" -> "Kilometers (km)"
- Widen `SelectTrigger` from `w-[100px]` to `w-[150px]` to fit the longer text

## 2. Reduce view-to-edit jitter

In `src/components/DetailDialog.tsx`, add `pl-2` (8px left padding) to the read-only value `<span>` in `FieldViewGrid` (line 155). This shifts the read-only text rightward to approximate where text sits inside the edit input box, reducing the visual jump when toggling modes. Applies to both Food and Exercise dialogs since they share the same component.

## 3. Fix "mi km" unit toggle alignment

In `src/components/DetailDialog.tsx`, the `UnitToggle` component has `ml-1` on its wrapper (line 88). Remove the `ml-1` so the toggle buttons align vertically with other unit labels that don't have this extra margin.

## 4. Add Cardio/Strength category filter on the Name row

The exercise type dropdown is too long. Add a category dropdown ("Cardio" / "Strength") to the right of the Name input. The exercise type dropdown row below stays as-is but gets filtered to only show relevant groups.

### Technical details

**A. New `FieldConfig` property:**
```typescript
pairedField?: FieldConfig;  // Rendered to the right on the same row
```

**B. `buildExerciseDetailFields` changes:**
- Add a virtual `_exercise_category` field as a `pairedField` on the `description` (Name) field
- `_exercise_category` is a `select` with options `[{value: 'strength', label: 'Strength'}, {value: 'cardio', label: 'Cardio'}]`
- The `exercise_key` optgroups are filtered based on the category: "Cardio" shows only the Cardio + Other groups; "Strength" shows everything except Cardio

**C. `flattenExerciseValues` changes:**
- Set `_exercise_category` based on `isCardioExercise(item.exercise_key)` -- 'cardio' or 'strength'

**D. `FieldEditGrid` rendering changes:**
- When a text field has a `pairedField`, render both on the same `col-span-2` row: the text input takes flex space, the paired select sits to the right with a compact fixed width
- When `_exercise_category` changes, clear `exercise_key` from draft (since the old key may not exist in the new category)
- The `exercise_key` field's optgroups are filtered dynamically at render time based on `draft._exercise_category`

**E. `FieldViewGrid` rendering changes:**
- When a field has a `pairedField`, show both values on the same row (Name + category label)
- Skip the `_exercise_category` field from normal rendering since it's already shown paired

**Files changed:**
1. `src/components/settings/PreferencesSection.tsx` -- unit labels + trigger width (4 lines)
2. `src/components/DetailDialog.tsx` -- view padding, unit toggle alignment, pairedField support, category filter logic (~60 lines of changes)

