

# Fix: Group Header Inline Editing - Match Working Individual Item Pattern Exactly

## Problem
Clicking on group header text (e.g., "Stuffed turkey dinner with sides") selects text instead of placing an editing cursor. Individual item descriptions work fine with the exact same `DescriptionCell` component.

## Root Cause
Two issues working together:

1. **EntryChevron tap target bleeds into text area**: The button uses `absolute inset-0 w-[44px] -left-3`, extending ~20px past its 12px container into the description text. This steals clicks from the beginning of the text.

2. **Wrapper div differs from the working individual item pattern**: Group headers use `max-h-[1.5rem]` (24px) which, combined with `py-1` padding (8px), leaves only 16px for the contentEditable span whose line-height is 24px -- the span overflows its container. Individual items use `max-h-[3rem]` and include `rounded` and `focus-within:` classes. The tight constraint plus `overflow-hidden` may cause browser-specific issues with contentEditable cursor placement.

## Fix

### 1. `src/components/EntryChevron.tsx`
Constrain the button to its container so it can never overlap adjacent elements:
- Remove `inset-0 w-[44px] -left-3`
- Use `w-full h-full` so the button fills only its parent container
- The parent container controls the tap target size

### 2. `src/components/FoodItemsTable.tsx` (chevron containers)
Widen chevron containers from `w-3` (12px) to `w-6` (24px) and add `overflow-hidden` to physically prevent any child from escaping. This gives a reasonable 24px tap target. Apply to all 6 chevron container locations (2 group headers + 2 individual item branches + 2 in WeightItemsTable).

### 3. `src/components/FoodItemsTable.tsx` (group header wrappers)
Make both group header description wrappers (collapsed line ~365, expanded line ~533) identical to the working individual item wrapper:
- Change `max-h-[1.5rem]` to `max-h-[3rem]`
- Add `rounded`
- Add `focus-within:ring-2 focus-within:ring-focus-ring focus-within:bg-focus-bg`
- Keep `font-semibold` on the expanded header wrapper to distinguish it visually

### 4. `src/components/WeightItemsTable.tsx` (chevron containers)
Apply the same chevron container changes (widen + overflow-hidden) for consistency.

## Technical Details

| File | Change |
|------|--------|
| `src/components/EntryChevron.tsx` | Replace `absolute inset-0 w-[44px] -left-3` with `w-full h-full` |
| `src/components/FoodItemsTable.tsx` | Widen all 4 chevron containers from `w-3` to `w-6`, add `overflow-hidden`; update both group header wrappers to match individual item pattern (`max-h-[3rem]`, `rounded`, `focus-within:` classes) |
| `src/components/WeightItemsTable.tsx` | Widen 2 chevron containers from `w-4`/`w-3` to `w-6`, add `overflow-hidden` |

