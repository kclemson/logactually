

## Add Calories to Items Preview Popover

### What We're Building
Display the calorie count next to each food item description in the saved meals popover.

### Implementation

**File: `src/pages/Settings.tsx`**

Update the list items in the PopoverContent (around lines 117-121) to include calories:

```tsx
// FROM:
<ul className="text-xs space-y-1">
  {meal.food_items.map((item) => (
    <li key={item.uid}>
      {item.description}
    </li>
  ))}
</ul>

// TO:
<ul className="text-xs space-y-1">
  {meal.food_items.map((item) => (
    <li key={item.uid} className="flex justify-between gap-2">
      <span>{item.description}</span>
      <span className="text-muted-foreground shrink-0">{item.calories}</span>
    </li>
  ))}
</ul>
```

### Layout Details

| Element | Styling | Purpose |
|---------|---------|---------|
| `<li>` | `flex justify-between gap-2` | Places description left, calories right |
| Description `<span>` | Default | Wraps naturally if long |
| Calories `<span>` | `text-muted-foreground shrink-0` | Muted color, won't shrink/wrap |

### Result
Each item will display like:
```
Vanilla Yogurt (1 container)              120
French bread five cheese pizza            280
```

The calories align to the right edge of the popover for easy scanning.

### Files to Change

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | Add flexbox layout and calories display to popover list items (lines 117-121) |

