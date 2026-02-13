

## Move Date Picker to Top and Add-Entry UX Cleanup

### 1. Move Date Navigation to the top
**File:** `src/pages/OtherLog.tsx`

Move the entire date navigation block (lines 152-218) to the top of the return, before the "Add Tracking Type" button. New order:

1. Date Navigation (moved from bottom)
2. Add Tracking Type button
3. Log type sections

### 2. Replace always-visible input fields with a "+ Add" button
**File:** `src/components/LogEntryInput.tsx`

Add an `expanded` state (default `false`). When collapsed, show just a small "+ Add" button. When the user clicks it, expand to reveal the input fields. After a successful submit, collapse back.

**File:** `src/pages/OtherLog.tsx`

No extra changes needed here beyond the date nav move -- the LogEntryInput component handles its own expand/collapse.

### Technical details

**Files changed:** 2

- `src/pages/OtherLog.tsx` -- move the date nav block (lines 152-218) above the "Add Tracking Type" section (line 95). ~25 lines moved, no logic changes.
- `src/components/LogEntryInput.tsx` -- wrap existing form in a collapsed/expanded toggle:
  - Add `const [expanded, setExpanded] = useState(false)`
  - When `!expanded`: render a `<button>` with `<Plus>` icon and "Add" text
  - When `expanded`: render existing form as-is
  - On successful submit (after clearing fields), call `setExpanded(false)`
