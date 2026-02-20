
## Expand swipe zone on History page to cover blank space below the calendar grid

### What's missing

The three log pages just got `min-h-[calc(100dvh-8rem)]` added to their swipe zone `div`. The History page has the same structure but was not included in that change.

Currently, the swipe zone `div` on History wraps only the calendar grid itself. On smaller phones or in landscape orientation — or simply when the calendar grid doesn't fill the screen — there's blank space below the grid that is outside the swipe zone entirely and won't respond to horizontal swipes.

### The fix

One-line addition to `src/pages/History.tsx`, line 325:

```tsx
// Before
<div ref={swipeHandlers.ref} onTouchStart={swipeHandlers.onTouchStart} onTouchEnd={swipeHandlers.onTouchEnd} style={{ touchAction: 'none' }}>

// After
<div ref={swipeHandlers.ref} onTouchStart={swipeHandlers.onTouchStart} onTouchEnd={swipeHandlers.onTouchEnd} style={{ touchAction: 'none' }} className="min-h-[calc(100dvh-8rem)]">
```

Note: History uses `touchAction: 'none'` (not `pan-y` like the log pages) because the calendar grid has no vertical scrolling — so no conflict there.

### Files changed

| File | Change |
|---|---|
| `src/pages/History.tsx` | Add `className="min-h-[calc(100dvh-8rem)]"` to swipe zone div at line 325 |

One line. No logic changes.
