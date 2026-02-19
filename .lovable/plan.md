
# Fix Left-Justification for All Custom Log Entry Types

## Two problems to solve

### Problem 1: `dual_numeric` (e.g. Blood Pressure) is still right-justified

Line 122 of `CustomLogEntryRow.tsx`:
```tsx
<div className="grid grid-cols-[1fr_auto_50px_24px] items-center gap-x-1 py-0.5 group">
  <span />  {/* ← this 1fr spacer pushes everything right */}
  <div className="flex items-center">  {/* value pair */}
  ...
```
The `1fr` spacer is in column 1, shoving the value pair to the right. Fix: move the spacer to after the unit label (same pattern needed for numeric).

### Problem 2: `numeric` / `text_numeric` still has an indent

Line 202: `grid-cols-[auto_auto_auto_1fr_24px]`

For a pure `numeric` type, columns 1 and 2 render as empty `<span />`s. Even though they're `auto`-sized (zero intrinsic width), the `gap-x-1` between them and the Input still creates visible left indent. Also the Input has `w-full` which makes it fill the `auto` column aggressively.

## The fix — one file, surgical edits

### `src/components/CustomLogEntryRow.tsx`

**Fix 1 — `dual_numeric` layout (lines 119–168):**

Change the grid from `grid-cols-[1fr_auto_50px_24px]` to `grid-cols-[auto_50px_1fr_24px]` and remove the leading spacer `<span />`. Layout becomes:

```
[value1/value2 flex] [unit 50px] [spacer 1fr] [delete 24px]
```

```tsx
// Before (line 122):
<div className="grid grid-cols-[1fr_auto_50px_24px] items-center gap-x-1 py-0.5 group">
  {/* Col 1: spacer pushes content right */}
  <span />
  {/* Col 2: tightly packed value pair */}
  <div className="flex items-center">

// After:
<div className="grid grid-cols-[auto_50px_1fr_24px] items-center gap-x-1 py-0.5 group">
  {/* Col 1: tightly packed value pair */}
  <div className="flex items-center">
```

Remove the leading `<span />` entirely.

**Fix 2 — `numeric` / `text_numeric` layout (lines 197–280):**

Change grid template and give the empty placeholder spans `className="contents"` (or just collapse them) so they don't add gap-induced indent.

The cleanest approach: use a **flex row** instead of a grid for this case. That way `numeric` types naturally start from the left with no phantom columns at all:

```tsx
// Before:
"grid-cols-[auto_auto_auto_1fr_24px]"

// After: use flex
"flex items-center gap-x-1"
```

Then the children (text div, colon span, input, unit span, delete button) naturally flow left-to-right with no phantom spacer columns. The Input gets a fixed `w-[60px]` instead of `w-full`, and the delete button is pushed right with `ml-auto`.

This also elegantly handles `text_numeric` (label → colon → number → unit → delete) without any phantom spans.

The `isTextOnly` branch already uses its own grid, so that branch is unaffected.

## Exact line changes

| Location | Before | After |
|---|---|---|
| Line 122 | `grid grid-cols-[1fr_auto_50px_24px] items-center gap-x-1` | `grid grid-cols-[auto_50px_1fr_24px] items-center gap-x-1` |
| Line 123-124 | `{/* Col 1: spacer */} <span />` then `{/* Col 2: value pair */}` | Remove spacer, `{/* Col 1: value pair */}` |
| Lines 198-202 | `grid ... grid-cols-[auto_auto_auto_1fr_24px]` | `flex items-center gap-x-1` |
| Line 248 | `w-full` on Input | `w-[60px]` |
| Line 266-278 | delete button (no change needed for position) | Add `ml-auto` to push it right in flex layout |

No other files need to change — this is entirely within `CustomLogEntryRow.tsx`.
