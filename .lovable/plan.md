

# Fix separator lines in tooltips

## Problem

The wrong lines were removed. The section separators between daily/weekly (and weekly/30-day) should stay. Instead, the border on the text description side of the `= total` row should be removed — keeping the underline only under the numbers.

## Changes

### 1. Restore section separators

**`src/components/CalorieTargetTooltipContent.tsx` (line 80)**
- Change `<div className="mt-2" />` back to `<div className="border-t border-muted-foreground/30 my-1" />`

**`src/components/CalorieTargetRollup.tsx` (line 158)**
- Change `<div className="mt-2" />` back to `<div className="border-t border-muted-foreground/30 my-1" />`

### 2. Remove border from text column on `= total` rows

**`src/components/CalorieTargetTooltipContent.tsx` (line 156)**
- Change: `<div className="text-[9px] italic opacity-60 border-t border-muted-foreground/30 pt-0.5">`
- To: `<div className="text-[9px] italic opacity-60 pt-0.5">`

**`src/components/CalorieTargetRollup.tsx`**
- Line 60: Remove `border-t border-muted-foreground/30` from the text div on the multiplier total row
- Line 95: Remove `border-t border-muted-foreground/30` from the text div on the standard total row

### Files changed

| File | Changes |
|------|---------|
| `src/components/CalorieTargetTooltipContent.tsx` | Restore section separator; remove border from text column on total row |
| `src/components/CalorieTargetRollup.tsx` | Restore section separator; remove border from text column on both total rows |

