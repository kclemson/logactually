
## Add swipe-left/right gesture for day navigation on mobile

### What's changing

A custom `useSwipeNavigation` hook handles horizontal touch swipes on a wrapper element. It will be applied to the content area below the input/add buttons on Food, Exercise, and Custom logs. The History page's calendar grid will also get swipe support for month navigation (since that's what the user's friend complained about).

### Approach

**New shared hook: `src/hooks/useSwipeNavigation.ts`**

Detects horizontal swipe gestures with safeguards to not interfere with:
- Vertical scrolling (only activates when horizontal intent is clear)
- Interactive elements inside the zone (inputs, buttons, selects, dialogs)
- The `PullToRefresh` gesture (which is vertical-only and won't conflict)

The hook returns `{ onTouchStart, onTouchMove, onTouchEnd }` event handlers to spread onto a `div`.

Core logic:
```ts
const MIN_SWIPE_X = 40;       // minimum px horizontal movement to count
const MAX_SWIPE_Y_RATIO = 0.6; // if vertical movement is >60% of horizontal, it's a scroll not a swipe

function useSwipeNavigation(onSwipeLeft: () => void, onSwipeRight: () => void, disabled = false)
```

- `onTouchStart`: records start X and Y
- `onTouchMove`: if vertical delta significantly exceeds horizontal delta early on, cancel the gesture (let the scroll through)
- `onTouchEnd`: if `|deltaX| >= MIN_SWIPE_X` and `|deltaY| / |deltaX| < MAX_SWIPE_Y_RATIO`, fire left or right callback

### Where it's applied

The hook is applied to a wrapper `div` that wraps the date navigation + entries section on each page. The "above" boundary is the bottom of the input section (LogInput / controls row), and it extends through all the entries.

| Page | Swipe zone covers | Callbacks |
|---|---|---|
| `FoodLog` | `DateNavigation` + `FoodItemsTable` section | `goToPreviousDay` / `goToNextDay` |
| `WeightLog` | `DateNavigation` + exercise entries section | `goToPreviousDay` / `goToNextDay` |
| `OtherLog` | `DateNavigation` + `CustomLogEntriesView` | `goToPreviousDay` / `goToNextDay` |
| `History` | entire calendar grid | `goToPreviousMonth` / `goToNextMonth` |

### Conflict avoidance

The hook checks `event.target` on `onTouchStart` — if the touch begins on an interactive element (input, button, select, [role="dialog"]) it sets a flag to skip the gesture entirely. This means:
- Tapping a row's edit/delete button → no swipe triggered
- Tapping the DateNavigation chevrons → no swipe triggered
- Dragging inside a text field → no swipe triggered

The `disabled` parameter allows callers to disable swipe when a dialog/popover is open (e.g. the calendar popover on `DateNavigation`).

### Files changed

| File | Change |
|---|---|
| `src/hooks/useSwipeNavigation.ts` | New hook — touch handlers returning `onTouchStart`, `onTouchMove`, `onTouchEnd` |
| `src/pages/FoodLog.tsx` | Wrap `DateNavigation` + entries `section` in a swipe `div` |
| `src/pages/WeightLog.tsx` | Same treatment as FoodLog |
| `src/pages/OtherLog.tsx` | Wrap `DateNavigation` + `CustomLogEntriesView` in a swipe `div` |
| `src/pages/History.tsx` | Wrap calendar grid in swipe `div` for month navigation |

### Technical notes

- The hook is mobile-only in effect but safe on desktop (touch events simply never fire)
- No new dependencies needed — pure React touch event handlers
- The `goToNextDay` from `useDateNavigation` already guards against future dates, so swiping left on today is a no-op navigation-wise
- Disabling during `calendarOpen` state prevents a race where the popover's internal swipe (calendar month picker) conflicts with the day-swipe handler
