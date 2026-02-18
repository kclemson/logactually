

# Fix 5 layout/behavior issues in the exercise detail dialog

All changes in two files: `src/components/DetailDialog.tsx` and `src/lib/weight-units.ts`.

---

## Issue 1: View-mode units are right-aligned (should be left-aligned next to the value)

**Root cause**: In `FieldViewItem` (line 168), the value span has `flex-1` which stretches it to fill available space, pushing the unit to the far right.

**Fix**: Remove `flex-1` from the value span so the unit sits immediately after the value text, left-aligned.

```
// Before
<span className="text-sm min-w-0 truncate pl-2 flex-1">

// After
<span className="text-sm min-w-0 truncate pl-2">
```

---

## Issue 2: "mi km" toggle starts further right than other units

**Root cause**: The UnitToggle buttons have `px-1.5` padding, adding ~6px of invisible space before the first letter. Static unit labels (like "min", "cal") have no such padding -- they're just text.

**Fix**: Remove left padding from the first toggle button. Easiest approach: the first button gets `pl-0` instead of `px-1.5`, using conditional styling (`pl-0 pr-1.5` for first, `px-1.5` for rest). Alternatively, wrap the toggle in a container with negative left margin to compensate. The cleanest fix is to just use `px-1` on all toggle buttons to tighten them up, plus remove the `gap-0.5` from the container so the buttons sit flush.

---

## Issue 3: Name row too close to the first grid row

**Root cause**: `FieldViewGrid` and `FieldEditGrid` render fullWidth fields and then the grid div with no vertical spacing between them. The fullWidth `FieldViewItem` has `py-0.5` but the grid columns use `gap-y-1` internally -- there's no gap between the two sections.

**Fix**: Add a consistent `gap-y-1` (or `space-y-1`) to the parent container in both `FieldViewGrid` and `FieldEditGrid`, so the full-width section and the two-column grid section have the same vertical rhythm as rows within the columns.

---

## Issue 4: Distance field doesn't show "km" in view mode

**Root cause**: `FieldViewItem` (lines 171-173) only renders the static `field.unit` text, and skips it when `field.unitToggle` is present. But it never renders the `UnitToggle` component itself in view mode -- that only exists in `FieldEditItem`. So unitToggle fields show no unit indicator at all in view mode.

**Fix**: In `FieldViewItem`, render the `UnitToggle` component for fields that have `unitToggle`, just like `FieldEditItem` does. This lets the user see and toggle between mi/km (and lbs/kg) even in view mode, with the displayed value converting accordingly.

---

## Issue 5: Speed needs mph/km/h toggle (like Distance has mi/km)

**Root cause**: Speed is defined as a plain metadata field via `metaField('speed_mph')` which just gets a static "mph" unit label. It needs a proper `unitToggle` to convert between mph and km/h based on the user's distance preference.

**Fix** (two parts):

### 5a. Add `convertSpeed` to `src/lib/weight-units.ts`

```typescript
export type SpeedUnit = 'mph' | 'km/h';

export function convertSpeed(value: number, from: SpeedUnit, to: SpeedUnit): number {
  if (from === to) return value;
  return from === 'mph' ? value * 1.60934 : value * 0.621371;
}
```

### 5b. Replace the speed metadata field with a unitToggle field

In `buildExerciseDetailFields`, instead of using `metaField('speed_mph')`, define speed as:

```typescript
{
  key: '_meta_speed_mph',
  label: 'Speed',
  type: 'number',
  unitToggle: { units: ['mph', 'km/h'], storageUnit: 'mph', convert: convertSpeed },
  min: 0.1,
}
```

The `defaultUnits` passed from the caller already maps based on the user's distance preference, so this will show km/h by default for users who prefer km, while still storing as mph.

### 5c. Pass default speed unit from caller

Wherever `defaultUnits` is constructed for exercise details, add a mapping: if the user's distance unit is 'km', set `_meta_speed_mph: 'km/h'`, otherwise `'mph'`.

---

## Summary of file changes

| File | What |
|------|------|
| `src/components/DetailDialog.tsx` | Fix 1: remove `flex-1` from view value span. Fix 2: tighten UnitToggle padding. Fix 3: add vertical gap between sections. Fix 4: render UnitToggle in view mode. Fix 5b: replace speed metaField with unitToggle field. |
| `src/lib/weight-units.ts` | Fix 5a: add `convertSpeed` function and `SpeedUnit` type. |
| Caller file (WeightLog or similar) | Fix 5c: add `_meta_speed_mph` to `defaultUnits` based on user's distance preference. |

