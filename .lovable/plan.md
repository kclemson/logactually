
## Expand swipe zone to cover the blank space below entries

### What's happening

The swipe zone `div` on each log page wraps only the `DateNavigation` bar + the entries section. It ends at the last entry. Any blank space below (visible when there are few entries) is inside `<main>` but **outside** the swipe zone `div` — so those touches are never picked up by the swipe listeners.

```
┌─────────────────────────────┐
│ Header                      │
├─────────────────────────────┤  ← swipe zone starts here
│ ← Mon Feb 20 →              │
│ Row 1                       │
│ Row 2                       │
├─────────────────────────────┤  ← swipe zone ENDS here
│                             │
│  (blank — not a swipe       │
│   target at all)            │
│                             │
├─────────────────────────────┤
│ Bottom Nav                  │
└─────────────────────────────┘
```

### The fix

Add `min-h` to the swipe zone div so it expands to fill the remaining screen. The bottom nav is `h-16` (64px) and the header is roughly `56px`, so the available area for content is `100dvh - ~120px`. Using `min-h-[calc(100dvh-8rem)]` gives a safe approximation that works across all three pages.

```tsx
<div
  ref={swipeHandlers.ref}
  onTouchStart={swipeHandlers.onTouchStart}
  onTouchEnd={swipeHandlers.onTouchEnd}
  style={{ touchAction: 'pan-y' }}
  className="min-h-[calc(100dvh-8rem)]"   // ← new
>
```

`100dvh` uses the dynamic viewport height unit which accounts for mobile browser chrome (address bar appearing/disappearing), making it more reliable than `100vh` on iOS Safari. The `8rem` (128px) accounts for the header + bottom nav combined height.

The blank area is now part of the swipe zone div. Since it contains no interactive elements, the `cancelled` check in the hook passes cleanly, and horizontal swipes across the empty area will work just like swiping the calendar grid in History.

No `data-swipe-exempt` changes are needed on any of these pages — the blank area has no buttons.

### Files changed

| File | Change |
|---|---|
| `src/pages/FoodLog.tsx` | Add `className="min-h-[calc(100dvh-8rem)]"` to swipe zone div |
| `src/pages/WeightLog.tsx` | Same |
| `src/pages/OtherLog.tsx` | Same |

That's three one-line additions. No logic changes.
