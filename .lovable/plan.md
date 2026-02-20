
## Fix: Vertical scrollbar appearing on the History/Calendar page

### Root cause

The swipe zone on History now has `min-h-[calc(100dvh-8rem)]`. The `8rem` (128px) was intended to account for the header + bottom nav, but the actual chrome is larger:

- Header `h-14` = **56px**
- `<main>` top padding `pt-4` = **16px**
- `<main>` bottom padding `pb-20` = **80px**
- Total = **152px ≈ 9.5rem**

So `100dvh - 8rem` is **24px taller** than the available space, creating real overflow and a scrollbar. The `PullToRefresh` wrapper has no overflow clipping, so this scrollable overflow is exposed.

This is a two-part fix:

### Fix 1 — Correct the height calculation on History

Change `min-h-[calc(100dvh-8rem)]` → `min-h-[calc(100dvh-10rem)]` on History's swipe zone. `10rem` = 160px, which safely exceeds the 152px of real chrome without under-shooting. History uses `touchAction: 'none'` so there's no vertical scroll conflict to worry about.

```tsx
// History.tsx swipe zone div — before
className="min-h-[calc(100dvh-8rem)] md:min-h-0"

// after
className="min-h-[calc(100dvh-10rem)] md:min-h-0"
```

### Fix 2 — Prevent PullToRefresh from exposing the overflow

The `PullToRefresh` wrapper div has `className="relative"` but no overflow clipping. Any content that grows slightly beyond the viewport creates a real scrollbar. Adding `overflow-x-hidden` to that wrapper prevents the horizontal case, but for vertical we need the scroll to stay with the page, not show a scrollbar. The real guard is just making the height calculation accurate (Fix 1), but as a belt-and-suspenders measure the outer `div.min-h-screen` in Layout already exists — we just need the math to be right.

### Files changed

| File | Change |
|---|---|
| `src/pages/History.tsx` | `min-h-[calc(100dvh-8rem)]` → `min-h-[calc(100dvh-10rem)]` |

One character change. The log pages (`FoodLog`, `WeightLog`, `OtherLog`) intentionally allow vertical scroll (they use `pan-y`) so the slight under-calculation there is fine — users can scroll down on long days. Only History has no vertical content to scroll and must not show a scrollbar.

### Why not `overflow: hidden` on the outer wrapper?

That would break the pull-to-refresh gesture (the content translateY animation would be clipped at the top) and would also break any tooltips or popovers that render near the edge.
