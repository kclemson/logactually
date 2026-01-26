
## Fix Items Preview Popover Size and Positioning

### The Problem
The current popover is too narrow (`w-48` = 192px) causing food item descriptions to be truncated. Screenshots show text like "French bread five cheese & gar..." and "Vanilla Yogurt (1 container (113..." getting cut off.

### Solution
1. **Increase width** - Change from `w-48` (192px) to `w-64` (256px) for more readable text
2. **Allow text wrapping** - Remove `truncate` class so full descriptions display (most food items are 1-2 lines)
3. **Adjust alignment** - Change to `align="end"` to anchor popover to the right side, preventing it from overlapping the meal name column

### Implementation

**File: `src/pages/Settings.tsx`**

**Lines 112-124** - Update PopoverContent styling:

```tsx
// FROM:
<PopoverContent 
  className="w-48 p-2" 
  side="top" 
  align="center"
  onOpenAutoFocus={(e) => e.preventDefault()}
>
  <ul className="text-xs space-y-0.5">
    {meal.food_items.map((item) => (
      <li key={item.uid} className="truncate">
        {item.description}
      </li>
    ))}
  </ul>
</PopoverContent>

// TO:
<PopoverContent 
  className="w-64 p-2" 
  side="top" 
  align="end"
  onOpenAutoFocus={(e) => e.preventDefault()}
>
  <ul className="text-xs space-y-1">
    {meal.food_items.map((item) => (
      <li key={item.uid}>
        {item.description}
      </li>
    ))}
  </ul>
</PopoverContent>
```

### Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| Width | `w-48` (192px) | `w-64` (256px) |
| Alignment | `align="center"` | `align="end"` (right-aligned) |
| Text overflow | `truncate` (ellipsis) | Removed (text wraps) |
| Line spacing | `space-y-0.5` | `space-y-1` (more readable) |

### Why These Changes
- **Wider popover**: 256px fits most food descriptions without wrapping excessively
- **Right alignment**: Anchors popover to the "X items" trigger, keeping it away from the meal name column
- **Text wrap instead of truncate**: Shows full item names since that's the purpose of the popover
- **Increased spacing**: Makes multi-line content more readable

### Files to Change

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | Update PopoverContent width, alignment, and remove truncation (lines 112-124) |
