

## Plan: Shorten Dialog Description Text

### Problem
The description "Give this meal a name to quickly log it again later." wraps with just "later." on its own line, which looks awkward.

### Solution
Shorten the description to fit on one line:

**Current (52 chars):**
> Give this meal a name to quickly log it again later.

**Proposed (41 chars):**
> Name this meal to quickly log it again.

### Changes

| File | Line | Current | Proposed |
|------|------|---------|----------|
| `src/components/SaveMealDialog.tsx` | 139 | "Give this meal a name to quickly log it again later." | "Name this meal to quickly log it again." |
| `src/components/SaveRoutineDialog.tsx` | 163 | "Give this routine a name to quickly log it again later." | "Name this routine to quickly log it again." |

### Result
Both descriptions will fit on a single line at the current dialog width.

