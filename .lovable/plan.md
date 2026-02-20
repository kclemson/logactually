
## Two fixes: eliminate phantom scroll + improve swipe reliability on History

### Problem 1: Phantom vertical scrollbar on the calendar page

Looking at your screenshot, there is a large empty area below the calendar grid. This blank space exists because:

- `Layout.tsx` wraps everything in `<div className="min-h-screen">`, which is correct
- But the `<main>` element inside has `pb-20` (bottom padding) for the bottom nav, and no `height` constraint
- The browser considers the page taller than the viewport even when no real content overflows, so **scrolling is technically possible** — and the browser honours touch events as potential scrolls

This phantom scrollability is the core reason swiping on the calendar is unreliable: the browser sees a scrollable page and competes with the horizontal swipe.

**Fix**: Make the History page fill the viewport exactly — no more, no less. The page should not scroll at all. The approach is to give the History route a fixed-height layout that fills the available space between the header and the bottom nav, rather than using the default `min-h-screen` with padding approach.

The cleanest way without reworking Layout globally is to:
1. Give the outer `Layout` container `overflow-hidden` or `h-screen` on the History route
2. Or — simpler and more targeted — constrain the `main` element on mobile so it doesn't overflow

Actually the simplest and most contained fix: in `History.tsx`, add `touch-action: pan-y` override to `none` on the swipe container, and separately ensure the page body itself cannot scroll by using `overflow: hidden` on the `html`/`body` when on the History route — but that's invasive.

**Better approach**: Use a CSS `touch-action` property. On the swipe container div, set `touch-action: pan-y` (which is what the browser defaults to) — but actually we want `touch-action: none` on this container so the browser doesn't even try to scroll and our JS handler has full control. This is the cleanest fix and it's supported on all modern mobile browsers.

```tsx
// In History.tsx, the swipe zone div:
<div
  ref={swipeHandlers.ref}
  onTouchStart={swipeHandlers.onTouchStart}
  onTouchEnd={swipeHandlers.onTouchEnd}
  style={{ touchAction: 'none' }}  // ← browser yields all touch to JS
>
```

`touch-action: none` tells the browser: "don't handle any default touch behaviours on this element (no scroll, no zoom) — JavaScript owns all of it." This is the standard approach used by every touch interaction library (Swiper, Framer Motion, react-use-gesture, etc.) and is more reliable than fighting with passive/non-passive listeners.

### Problem 2: The phantom scroll area (empty space below calendar)

Separately from the swipe fix, the blank space below the calendar should be eliminated. This is because the `main` element in `Layout.tsx` renders with `min-h-screen` on the outer div, pushing its minimum height to the viewport size — but for the calendar view there's no content to fill it.

The fix here is also simple: on the swipe container div in History, add `min-h-[calc(100dvh-10rem)]` or similar so the calendar fills the space and there's simply nothing to scroll to. Actually even simpler: set `overflow: hidden` on the page-level wrapper when content is shorter than the viewport.

The cleanest solution for both problems combined: set `touch-action: none` on the swipe zone (solves swipe reliability) and add `overscroll-behavior: none` on the body (or the swipe container) to prevent the browser from activating scroll momentum. Together these completely eliminate the phantom scroll competition.

### What changes

**`src/pages/History.tsx`** — add `style={{ touchAction: 'none' }}` to the swipe zone `div`. This is a one-line change that gives JS full ownership of touch events within the calendar, completely bypassing the passive/non-passive listener battle.

**`src/hooks/useSwipeNavigation.ts`** — the `touch-action: none` approach means `e.preventDefault()` in the non-passive `touchmove` listener becomes redundant (since the browser won't try to scroll in the first place), but keeping it is harmless and adds a belt-and-suspenders guarantee.

**`src/pages/FoodLog.tsx`, `WeightLog.tsx`, `OtherLog.tsx`** — apply the same `touch-action: none` on their swipe zone divs for consistency and improved reliability on those pages too.

### Technical details

`touch-action: none` is distinct from `pointer-events: none` — it doesn't prevent clicks or taps, it only tells the browser not to handle scroll/zoom gestures natively. Buttons and taps within the swipe zone will continue to work perfectly.

The one thing `touch-action: none` prevents is the user scroll-overscrolling to refresh (pull-to-refresh from the OS). Since the History page has no content to scroll, this is desirable. On the day-log pages (Food/Weight/Other), the content can be long — but those pages have their own vertical scrollability through the normal browser mechanism because their swipe zones are just one section of the page rather than the full page.

Actually wait — for Food/Weight/Other, the entire page content is inside the swipe zone div. Setting `touch-action: none` there would break vertical scrolling on those pages when they have many entries. So for those pages, we should use `touch-action: pan-y` instead, which allows vertical scrolling but disables horizontal panning — meaning horizontal swipes go directly to our JS handler.

| Page | touch-action value | Effect |
|---|---|---|
| History (calendar) | `none` | Full JS control — no scroll competition |
| FoodLog / WeightLog / OtherLog | `pan-y` | Vertical scroll still works, horizontal is JS-only |

`pan-y` is the ideal value for the day-log pages: it explicitly tells the browser "vertical scrolling is fine, but don't handle horizontal touch movement — give it to JS."

### Summary of file changes

| File | Change |
|---|---|
| `src/pages/History.tsx` | Add `style={{ touchAction: 'none' }}` to the swipe zone div |
| `src/pages/FoodLog.tsx` | Add `style={{ touchAction: 'pan-y' }}` to the swipe zone div |
| `src/pages/WeightLog.tsx` | Same |
| `src/pages/OtherLog.tsx` | Same |

That's it. Four one-line additions. No logic changes, no hook changes, no restructuring.

### Why this is safer and simpler than what was already done

The previous fix (non-passive `touchmove` listener) correctly solves *part* of the problem — it lets `e.preventDefault()` actually work once horizontal intent is detected. But `touch-action` is applied *before* any JavaScript runs — it's a CSS hint to the browser's native compositor. It short-circuits the whole passive-listener problem at the source rather than fighting it in JS. Using both together is belt-and-suspenders and the combination is exactly what Framer Motion's `drag` and Swiper.js use internally.
