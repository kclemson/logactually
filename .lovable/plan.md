
## Fix: Min-height on swipe zone should only apply on mobile

### Root cause

The class `min-h-[calc(100dvh-8rem)]` was added to the swipe zone `div` on all four pages (History, FoodLog, WeightLog, OtherLog) to make the blank space below entries/the calendar swipeable on mobile. On desktop there is no bottom nav overlapping content and the layout is different, so this forces the entire page to be at least `100dvh - 128px` tall — creating a large black void below the calendar and pushing the bottom nav off the bottom of the screen.

Tailwind is mobile-first, so `min-h-[calc(100dvh-8rem)]` applies at all breakpoints. It needs to be reset at the `md` breakpoint.

### The fix

Add `md:min-h-0` alongside the existing class on all four swipe zone divs. This keeps the expanded swipe zone on mobile but resets it to the natural content height on desktop (`md` = 768px and up).

**Before:**
```tsx
className="min-h-[calc(100dvh-8rem)]"
```

**After:**
```tsx
className="min-h-[calc(100dvh-8rem)] md:min-h-0"
```

### Files changed

| File | Change |
|---|---|
| `src/pages/History.tsx` | Add `md:min-h-0` to swipe zone div |
| `src/pages/FoodLog.tsx` | Same |
| `src/pages/WeightLog.tsx` | Same |
| `src/pages/OtherLog.tsx` | Same |

Four one-word additions. No logic changes.
