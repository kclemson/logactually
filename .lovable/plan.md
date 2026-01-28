

## Replace × Character with x in Routine Names

The default names for saved routines use the Unicode multiplication sign `×` (U+00D7) which has inconsistent spacing compared to a regular lowercase `x`. This causes visual layout issues as shown in the screenshot.

---

### Current State

The `×` character appears in these locations:
- `SaveRoutineDialog.tsx` line 32: `${first.sets}×${first.reps}`
- `SaveRoutineDialog.tsx` line 101: `{set.sets}×{set.reps}`
- `CreateRoutineDialog.tsx` line 28: `${first.sets}×${first.reps}`

---

### Solution

Replace all instances of `×` with the regular lowercase letter `x`.

**Before:** `Seated Calf Extension (3×10 @ 180 lbs)`
**After:** `Seated Calf Extension (3x10 @ 180 lbs)`

---

### Files to Modify

| File | Line | Change |
|------|------|--------|
| `src/components/SaveRoutineDialog.tsx` | 32 | `${first.sets}×${first.reps}` → `${first.sets}x${first.reps}` |
| `src/components/SaveRoutineDialog.tsx` | 101 | `{set.sets}×{set.reps}` → `{set.sets}x{set.reps}` |
| `src/components/CreateRoutineDialog.tsx` | 28 | `${first.sets}×${first.reps}` → `${first.sets}x${first.reps}` |

---

### Note

This change only affects newly created routine names going forward. Existing saved routines with `×` in their names will retain the old character unless the user manually edits them.

