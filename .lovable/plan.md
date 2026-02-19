
# Left-Justify Section Headers and Values Across All Three Custom Log Views

## What's centered today and why

All three views use `text-center` on their section group headers, and the non-medication By Date view has values that appear right-of-center because the value `<span>` carries `flex-1` (filling remaining space) while the date column is a fixed `w-32`.

## Changes — file by file

### 1. `src/components/AllMedicationsView.tsx` (By Meds view)

**Section header** (line 89): change `text-center` to left-aligned.

```tsx
// Before
<div className="text-center py-1">
  <span className="text-xs font-medium text-muted-foreground">
    {group.typeName}
  </span>
</div>

// After
<div className="py-1">
  <span className="text-xs font-medium text-muted-foreground">
    {group.typeName}
  </span>
</div>
```

No change needed to the entry rows themselves — they already read left-to-right: time → dose → buttons.

---

### 2. `src/pages/OtherLog.tsx` (By Date view)

**Section header** (line 454): same fix — remove `text-center`.

```tsx
// Before
<div className="text-center py-1">
  <span className="text-xs font-medium text-muted-foreground">
    {logType?.name || 'Unknown'}
  </span>
</div>

// After
<div className="py-1">
  <span className="text-xs font-medium text-muted-foreground">
    {logType?.name || 'Unknown'}
  </span>
</div>
```

The `CustomLogEntryRow` entries beneath the header are handled by the existing CSS grid — numeric values currently sit in a right-side column. However the user's 4th screenshot is from the **By Date** view, showing `148.8 lbs` right of center. The value layout in `CustomLogEntryRow` uses `grid-cols-[1fr_auto_60px_50px_24px]` where the first `1fr` is a spacer. That `1fr` spacer pushes numeric content to the right. Removing the spacer (making it `grid-cols-[auto_60px_50px_24px]`) would left-justify, but the date column sits in `CustomLogTypeView`, not `CustomLogEntryRow`.

Wait — in **By Date** mode, the entry rows are `CustomLogEntryRow`, which has no date column. The date is shown in the `CustomLogTypeView` header area. So the `1fr` spacer in `CustomLogEntryRow` is what causes numeric values to sit far right. Changing the grid from `grid-cols-[1fr_auto_60px_50px_24px]` to `grid-cols-[auto_60px_50px_24px]` (drop the leading spacer) would left-align the values.

Actually re-reading: the 4th screenshot is "By Date" view with a numeric type (Body Weight). The `CustomLogEntryRow` for a `numeric` type renders:
- Col 1: spacer (`<span />`) — this is the `1fr` that pushes everything right
- Col 2: separator (empty `<span />` for non-text_numeric)
- Col 3: numeric `Input` (60px)
- Col 4: unit label (50px)
- Col 5: delete button (24px)

To left-justify, swap the grid template to put the value first, remove the leading spacer.

### 3. `src/components/CustomLogEntryRow.tsx` (By Date view — non-medication rows)

For all non-`isDualNumeric`, non-`isMultiline`, non-`isTextOnly` types (i.e., `numeric` and `text_numeric`): change the grid so the value columns come first and there's no leading `1fr` spacer:

```tsx
// Before
"grid-cols-[1fr_auto_60px_50px_24px]"

// After
"grid-cols-[60px_50px_auto_1fr_24px]"
// Columns: numeric input | unit | colon (for text_numeric) | flex spacer | delete
```

Wait — let me think about this more carefully. The grid is shared by both `numeric` (no text) and `text_numeric` (has both text + numeric). For `text_numeric`, the text label should come first (left), then colon, then number, then unit.

The cleanest approach: just reverse the column order so text/value appears on the left side:

```
grid-cols-[minmax(0,1fr)_auto_60px_50px_24px]
```

Currently col 1 is a spacer `<span/>` when `hasText` is false (numeric types). Swap it: for numeric-only types, put the numeric input first (no leading spacer).

The simplest targeted fix: for `numeric` value type specifically, change the grid so numeric input is col 1 (no spacer), unit is col 2, delete is col 3:

For the non-text-only, non-dual-numeric branch, change the grid to:
```
grid-cols-[auto_auto_auto_1fr_24px]
```
With columns: text (or empty) | colon | numeric | unit | delete — this keeps text_numeric working (text left, colon, number, unit) while numeric types just have empty | empty | number | unit | delete but now the spacer is at the end (col 4 = `1fr`) rather than the front.

### 4. `src/components/CustomLogTypeView.tsx` (By Type view)

The By Type view row is a flex row: `date (w-32)` → `value (flex-1)` → `buttons`. The value column being `flex-1` means it takes all remaining space but the text inside starts from the left of that space. So values should already be left-aligned within their column. Looking at the 4th screenshot again — this is actually the **By Date** view (shows "Wed, Feb 18" date navigation), not the By Type view. The By Type view already has values appearing left-aligned relative to the date column.

So `CustomLogTypeView.tsx` only needs the section header fix for the **By Type** view — but actually `CustomLogTypeView` doesn't render a section header (it's a single log type view; the type name is shown in the toolbar dropdown). No header change needed here.

## Summary of all changes

| File | Change |
|---|---|
| `src/components/AllMedicationsView.tsx` | Remove `text-center` from the med-name group header `<div>` |
| `src/pages/OtherLog.tsx` | Remove `text-center` from the log-type group header `<div>` in the By Date entries section |
| `src/components/CustomLogEntryRow.tsx` | For the standard grid row (non-text-only, non-dual-numeric), move the `1fr` spacer from column 1 to after the unit label so numeric values appear on the left |

No database changes, no new dependencies.
