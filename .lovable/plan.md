
# Three Changes to Medication Entry UX

## Overview of changes

1. Reorder the content in `MedicationEntryInput` so the layout flows: name → schedule → (gap) → description → (gap) → [time] [dose] [unit] [Save] → dose count line → notes textarea
2. Add conditional colour formatting to the "X of Y doses logged today" line
3. Convert the inline `MedicationEntryInput` (and `LogEntryInput` for consistency) in the "By Type" view into a modal dialog with a backdrop overlay, instead of pushing the page content down

---

## Change 1 — Reorder content in `MedicationEntryInput`

**Current order inside the context block:**
1. description
2. schedule (e.g. `2x/day · morning, evening`)
3. dose count ("X of Y doses logged today")

**Target order (per mockup):**
```
Medication name           ← already at top (keep)
2x/day · morning, evening ← pull schedule UP, out of the muted box
[blank gap]
description (in muted box) ← description goes inside the muted box alone
[blank gap]
[Time] [Dose] [mg] [Save] ← inputs row (keep)
X of Y doses logged today  ← dose count moves BELOW the input row
[Notes textarea]           ← (keep)
```

Concretely in `MedicationEntryInput.tsx`:

- Move `scheduleSummary` line up to appear just below the name header (outside the muted box), as plain `text-xs text-muted-foreground`
- The muted box now contains only `description` (if present)
- After the `[Time] [Dose] [Save]` row, render the `doseCountLine` with conditional colour (see Change 2)
- Notes textarea stays at the bottom

---

## Change 2 — Conditional formatting for "X of Y doses logged today"

Logic:

| Condition | Style |
|---|---|
| `dosesPerDay === 0` (as-needed) and `todayEntryCount > 0` | Neutral muted — just "N doses logged today" |
| `todayEntryCount === 0` | Neutral muted — no emphasis needed |
| `todayEntryCount > 0` and `todayEntryCount < dosesPerDay` | Amber/warning — partial, e.g. `text-amber-500` |
| `todayEntryCount === dosesPerDay` | Green — on track, e.g. `text-green-500 dark:text-green-400` |
| `todayEntryCount > dosesPerDay` | Red — over limit, e.g. `text-red-500` |

This gives a clear at-a-glance status without feeling alarming (amber is "good progress, not done" and green is "complete").

Implementation: a small helper function `getDoseCountStyle(todayEntryCount, dosesPerDay)` returns a Tailwind class string. Applied to the `doseCountLine` paragraph below the input row.

---

## Change 3 — Convert inline entry form to a dialog with overlay

**Problem:** When "Log New" is clicked in "By Type" view, `MedicationEntryInput` (or `LogEntryInput`) renders inline, pushing the toolbar row up and the entries list down — cluttering the view.

**Solution:** Wrap `MedicationEntryInput` and `LogEntryInput` in a simple modal dialog (using the existing `Dialog`/`DialogContent` from `@radix-ui/react-dialog`) so the background is masked and the data entry is focused.

The dialog:
- No `DialogHeader` (the medication name is already inside `MedicationEntryInput` as a label)
- `DialogContent` with `className="max-w-sm p-0"` to let `MedicationEntryInput` control its own padding
- The existing `onCancel` closes the dialog, so no extra close button needed (the `X` inside `MedicationEntryInput` already handles that, and Radix provides an accessible dismiss)
- For `LogEntryInput` (non-medication types), same wrapping

This applies only in "By Type" view mode. In "By Date" view mode, the existing inline behavior is fine (it's already inside the top section with a fixed min-height).

Actually, re-reading the user's request: "#3: When the user clicks 'log new', it moves the top row of dropdowns/buttons up a row..." — this is specifically about the "By Type" view's "Log New" button triggering inline entry. The fix: instead of `setShowInput(true)` inline, open a `Dialog` with the entry form inside.

**Implementation approach:**

In `OtherLog.tsx`, add a `showInputDialog` boolean state (separate from `showInput` which controls the By Date inline form). When in `viewMode === 'type'`, clicking "Log New" sets `showInputDialog(true)`. The `Dialog` containing `MedicationEntryInput` or `LogEntryInput` is rendered at the bottom of the page component (outside the section), and `onSubmit`/`onCancel` set `showInputDialog(false)`.

The By Date inline form behaviour is unchanged.

---

## Files changed

| File | Change |
|---|---|
| `src/components/MedicationEntryInput.tsx` | Reorder layout (schedule up, description in muted box alone, dose count below inputs with colour); add `getDoseCountStyle` helper |
| `src/pages/OtherLog.tsx` | Add `showInputDialog` state; "Log New" in type view opens Dialog; render Dialog at bottom of component |

No DB changes. No new hooks needed.
