

# Fix vertical spacing and re-layout exercise detail fields

## 1. Increase vertical row spacing (focus ring fix)

The current `gap-y-0.5` (2px) clips focus rings on inputs. Increase to `gap-y-1` (4px) in both `FieldViewGrid` and `FieldEditGrid` grid containers, and keep `py-0.5` on view rows consistent with edit rows so switching modes doesn't cause layout jumps.

**File: `src/components/DetailDialog.tsx`**
- Line 134 (FieldViewGrid grid): `gap-y-0.5` to `gap-y-1`
- Line 175 (FieldEditGrid grid): `gap-y-0.5` to `gap-y-1`

## 2. Flatten exercise field sections

The section names `'Basic'`, `'Performance'`, and `'Metadata'` are still assigned to exercise fields even though the section headers were removed from the UI. Each section renders in its own separate grid container, which prevents cross-section column alignment and complicates reordering.

**File: `src/components/DetailDialog.tsx`**
- In `buildExerciseDetailFields` (~lines 565-600): Remove all `section` properties from exercise fields (or assign them all the same section like `''`). This merges all exercise fields into a single grid, enabling proper column alignment and free reordering.
- Food fields keep their `Basic`/`Nutrition` sections unchanged.

## 3. Reorder exercise fields and use asymmetric columns

With all exercise fields in one grid, reorder them so wider-content fields land in the left (odd) positions. Add a `gridClassName` prop to `DetailDialog` so the exercise dialog can use an asymmetric column split.

**Desired field order for cardio exercises:**

```text
| Left column (wider)       | Right column (narrower)  |
|---------------------------|--------------------------|
| Name (full width, col-span-2)                        |
| Exercise type             | Subtype                  |
| Distance (mi)             | Duration (min)           |
| Cal Burned (cal)          | Effort (/10)             |
| Speed (mph)               | Heart Rate (bpm)         |
|                           | Incline (%)              |
|                           | Cadence (rpm)            |
```

**Desired field order for strength exercises:**
No change needed -- Sets, Reps, Weight are short labels that work fine in equal columns.

### Technical details

**File: `src/components/DetailDialog.tsx`**

- Add optional `gridClassName?: string` prop to `DetailDialogProps` interface.
- Thread `gridClassName` through to `FieldViewGrid` and `FieldEditGrid`, replacing the hardcoded `grid-cols-2` with `gridClassName` (default: `"grid-cols-2"`).
- In `buildExerciseDetailFields` for cardio: push fields in this order:
  1. `description` (text, full-width)
  2. `exercise_key` (select)
  3. `exercise_subtype` (select, if applicable)
  4. `distance_miles` (number with unit toggle)
  5. `duration_minutes` (number)
  6. Then metadata in pairs: `calories_burned`, `effort`, `speed_mph`, `heart_rate`, `incline_pct`, `cadence_rpm` -- explicitly ordered rather than iterating `KNOWN_METADATA_KEYS` in definition order.

**File: `src/pages/WeightLog.tsx`**

- Pass `gridClassName="grid-cols-[3fr_2fr]"` to the `DetailDialog` used for exercise entries. This gives the left column ~60% width for the wider fields/inputs.

