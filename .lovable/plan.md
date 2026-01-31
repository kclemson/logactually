

## Cardio Display Improvements

### Overview

Two related improvements for better cardio exercise display:
1. Show "cardio" label instead of three "0" inputs in editable table rows
2. Use duration format for cardio exercises in the Save Routine dialog

---

### Change 1: WeightItemsTable - Show "cardio" label in editable mode

**File:** `src/components/WeightItemsTable.tsx`

Add a cardio detection helper and conditionally render a "cardio" label instead of three numeric input fields for cardio rows.

**Visual result:**

| Before (editable) | After (editable) |
|-------------------|------------------|
| `Treadmill Walk [0] [0] [0] [X]` | `Treadmill Walk   cardio   [X]` |

The label will be gray, italic, and span across where the 3 inputs would be.

---

### Change 2: SaveRoutineDialog - Two places need cardio-aware formatting

**File:** `src/components/SaveRoutineDialog.tsx`

**Place 1 - Default name (line 32):**
The `getDefaultName()` function generates the initial value for the routine name input field.

**Place 2 - Exercise list preview (line 94):**
The bullet list showing each exercise under "Exercises (X):" label.

Both currently use `(sets)x(reps) @ (weight)lbs` format. Both will be updated to detect cardio and use `(duration min)` format instead.

| Location | Before (cardio) | After (cardio) |
|----------|-----------------|----------------|
| Default name input | `Rowing Machine (0x0 @ 0 lbs)` | `Rowing Machine (15 min)` |
| Exercise list bullet | `Rowing Machine (0x0 @ 0lbs)` | `Rowing Machine (15 min)` |

---

### Change 3: CreateRoutineDialog - Fallback name

**File:** `src/components/CreateRoutineDialog.tsx`

Update `getFallbackName` in `WEIGHTS_CONFIG` with the same cardio detection logic for consistency.

---

### Detection Logic (used in all changes)

```typescript
const isCardio = item.weight_lbs === 0 && (item.duration_minutes ?? 0) > 0;
```

This requires BOTH conditions to avoid false positives.

---

### Files Modified

| File | Changes |
|------|---------|
| `src/components/WeightItemsTable.tsx` | Add cardio detection; show "cardio" label instead of 3 inputs for cardio rows |
| `src/components/SaveRoutineDialog.tsx` | Add `formatExerciseSummary` helper; update `getDefaultName` (line 32) and exercise list rendering (line 94) |
| `src/components/CreateRoutineDialog.tsx` | Update `getFallbackName` to handle cardio format |

