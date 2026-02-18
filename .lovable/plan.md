

# Fix DetailDialog mobile spacing: 5 targeted changes

## Problem
On mobile, both view and edit modes have spacing/truncation issues. The "Exercise type:" label is unnecessarily wide, view-mode values lack alignment, select dropdown font changes didn't apply on mobile, and labels could be slightly smaller.

## Changes

### 1. Rename "Exercise type:" to "Type:" (`src/components/DetailDialog.tsx`, ~line 720)
Change `label: 'Exercise type'` to `label: 'Type'`. This is the widest label in the right column; shortening it recovers significant space.

### 2. Add min-width to view-mode values for unit alignment (`src/components/DetailDialog.tsx`, ~line 169)
In `FieldViewItem`, add `min-w-[2rem]` to the value `<span>` so numeric values like "12", "1.61", "8.05" occupy consistent width, causing their trailing units (min, mi, mph) to align vertically. Change:
```
<span className="text-sm min-w-0 truncate">
```
to:
```
<span className="text-sm min-w-0 truncate min-w-[2rem]">
```
Note: for number fields only. We can apply this conditionally via the field type, or just universally since text fields span full width anyway.

### 3. Revert select font to `text-sm`, add mobile-only `text-xs` (`src/components/DetailDialog.tsx`, ~line 226)
The `text-xs` class on the `<select>` element isn't taking effect on mobile likely because the browser enforces a minimum. Use `text-sm sm:text-sm text-xs` won't work since Tailwind is mobile-first. The correct approach: keep `text-xs` as the base (mobile) and add `sm:text-sm` for desktop so desktop gets the original size back. Change:
```
text-xs focus-visible:outline-none
```
to:
```
text-xs sm:text-sm focus-visible:outline-none
```
This ensures mobile gets 12px and desktop gets 14px.

### 4. Shrink labels on mobile (`src/components/DetailDialog.tsx`, lines 166 and 212)
Both `FieldViewItem` and `FieldEditItem` use `text-xs` (12px) for labels. We can go one step smaller on mobile with `text-[11px] sm:text-xs`. This saves ~1px per character across all labels. Change both label spans from:
```
"text-xs text-muted-foreground shrink-0"
```
to:
```
"text-[11px] sm:text-xs text-muted-foreground shrink-0"
```

### 5. Shrink label min-width on mobile only
In `WeightLog.tsx` and `FoodLog.tsx`, change `min-w-[4rem]` to `min-w-[3.5rem] sm:min-w-[4rem]` so mobile labels are narrower while desktop keeps current spacing. Four instances total (2 per file).

## Files changed

| File | What |
|------|------|
| `src/components/DetailDialog.tsx` | Rename "Exercise type" to "Type"; add `min-w-[2rem]` to view values; select `text-xs sm:text-sm`; labels `text-[11px] sm:text-xs` |
| `src/pages/WeightLog.tsx` | `min-w-[3.5rem] sm:min-w-[4rem]` (2 places) |
| `src/pages/FoodLog.tsx` | `min-w-[3.5rem] sm:min-w-[4rem]` (2 places) |

## Technical notes

- `text-[11px]` is a Tailwind arbitrary value; 11px is legible on mobile retina screens.
- The `sm:` breakpoint (640px) cleanly separates phone from tablet/desktop.
- Safari auto-zoom only applies to `<input>` elements below 16px, not `<select>`, so `text-xs` on selects is safe.
- The `min-w-[2rem]` on view values creates consistent alignment without being so wide it wastes space for short values like "3".
