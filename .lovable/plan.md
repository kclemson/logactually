
## Add Items Preview Popover for Saved Meals

### What We're Building
A click-to-open popover on the "X items" text that shows the list of food items in that meal. Works on both desktop (click) and mobile (tap).

### Implementation

**File: `src/pages/Settings.tsx`**

Replace the item count span (lines 105-108) with a Popover:

```tsx
{/* Item count with popover to show items */}
<Popover>
  <PopoverTrigger asChild>
    <span className="text-xs text-muted-foreground shrink-0 cursor-pointer hover:text-foreground transition-colors">
      {meal.food_items.length} {meal.food_items.length === 1 ? 'item' : 'items'}
    </span>
  </PopoverTrigger>
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
</Popover>
```

### Key Details

| Aspect | Choice |
|--------|--------|
| Interaction | Click/tap (Radix Popover default) - works on both desktop and mobile |
| Width | `w-48` (192px) - compact but readable |
| Padding | `p-2` - minimal for a tight list |
| Position | `side="top"` - consistent with delete popover, avoids edge clipping on mobile |
| Trigger styling | `cursor-pointer hover:text-foreground` - indicates interactivity |
| Focus handling | `onOpenAutoFocus={(e) => e.preventDefault()}` - prevents jarring focus shift |

### Mobile Compatibility
Radix UI's Popover is click-based, which means:
- **Desktop**: Click to open
- **Mobile**: Tap to open

This works seamlessly on mobile without any additional configuration. The `side="top"` positioning also prevents the popover from getting clipped at screen edges on narrow viewports.

### Files to Change

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | Wrap item count span (lines 105-108) with Popover showing food items list |
