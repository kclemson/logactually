
## Fix: future-month guard + slide animations for all swipe navigation

### Two problems being solved

1. **History calendar allows swiping to future months** — the `goToNextMonth` callback passed to `useSwipeNavigation` has no guard, unlike the chevron button which has `disabled={isSameMonth(currentMonth, new Date())}`.

2. **No animation on swipe** — all five pages (Food, Weight, Other, History) snap instantly because there's no visual feedback about direction.

---

### The animation challenge

All three day-log pages (Food, Weight, Other) use the `key={dateKey}` wrapper pattern: the outer shell reads the date from the URL and passes `key={dateKey}` to the inner content component, which causes a **full remount** on every date change. This means we cannot simply put a keyed `<div key={dateStr}>` inside the swipe zone — that div will never get a chance to animate because the whole component tree is being replaced.

The solution is to **animate at the wrapper level** — the shell component (the one that holds `key={dateKey}`) needs to apply a slide-in CSS animation each time it mounts. Since it remounts on every navigation, the animation plays naturally every time.

For **History**, the approach is simpler: `currentMonth` is local state so nothing remounts — a keyed `<div key={monthStr}>` around the calendar grid is all that's needed.

---

### Implementation plan

#### 1. New shared animation classes in `tailwind.config.ts`

Add two new keyframes and animation classes:

```ts
"slide-in-from-right": {
  "0%":   { opacity: "0", transform: "translateX(24px)" },
  "100%": { opacity: "1", transform: "translateX(0)" },
},
"slide-in-from-left": {
  "0%":   { opacity: "0", transform: "translateX(-24px)" },
  "100%": { opacity: "1", transform: "translateX(0)" },
},
```

Animation classes: `animate-slide-in-from-right` (200ms ease-out) and `animate-slide-in-from-left` (200ms ease-out). The 24px translate is subtle — enough to feel directional without being a full-screen slide.

#### 2. `src/lib/selected-date.ts` — persist swipe direction

Add two tiny helpers to write/read a swipe direction hint to `sessionStorage`:

```ts
export function setSwipeDirection(dir: 'left' | 'right' | null): void
export function getSwipeDirection(): 'left' | 'right' | null
```

This is how the shell (wrapper) communicates which direction was swiped to the newly-mounted inner content component. `sessionStorage` is used (not `localStorage`) because it's per-tab and naturally ephemeral.

#### 3. `src/hooks/useSwipeNavigation.ts` — write direction before calling callback

When a swipe is recognised, write the direction to `sessionStorage` before calling `onSwipeLeft` / `onSwipeRight`:

```ts
if (deltaX < 0) {
  setSwipeDirection('left');
  onSwipeLeft();
} else {
  setSwipeDirection('right');
  onSwipeRight();
}
```

The callbacks (`goToNextDay`, `goToPreviousDay`) update the URL, which triggers a remount of the content component. By the time that component mounts, the direction value is already in `sessionStorage`.

#### 4. Day-log pages — read direction on mount, apply animation class

In `FoodLogContent`, `WeightLogContent`, and `OtherLogContent` — these are the components that remount on every date change. Add a one-time read on initial render:

```tsx
const mountDir = getSwipeDirection();
setSwipeDirection(null); // consume it immediately so it doesn't bleed into other navigations
```

Apply the animation class to the outermost `<div className="space-y-4">`:

```tsx
<div className={cn(
  "space-y-4",
  mountDir === 'left'  && 'animate-slide-in-from-right',
  mountDir === 'right' && 'animate-slide-in-from-left',
)}>
```

This is read synchronously during render (not in a `useEffect`), so there's no flash — the class is set on the very first paint.

#### 5. History page — keyed animated calendar grid div

Since History doesn't remount, use a keyed `<div>` around the calendar grid (week headers + day cells) and track `slideDir` state:

```tsx
const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);

const goToPreviousMonth = () => { setSlideDir('right'); setCurrentMonth(subMonths(currentMonth, 1)); };
const goToNextMonthGuarded = () => {
  if (isSameMonth(currentMonth, new Date())) return; // guard future months
  setSlideDir('left');
  setCurrentMonth(addMonths(currentMonth, 1));
};

// Inside JSX, inside the existing swipeHandlers div:
<div
  key={format(currentMonth, 'yyyy-MM')}
  className={cn(
    slideDir === 'left'  && 'animate-slide-in-from-right',
    slideDir === 'right' && 'animate-slide-in-from-left',
    !slideDir && 'animate-fade-in', // first load: fade in
  )}
>
  {/* week day headers */}
  {/* calendar grid */}
</div>
```

Also pass `goToNextMonthGuarded` to `useSwipeNavigation` instead of `goToNextMonth`, and update the chevron button's `onClick` to use it as well.

---

### Files changed

| File | Change |
|---|---|
| `tailwind.config.ts` | Add `slide-in-from-right` and `slide-in-from-left` keyframes + animation utilities |
| `src/lib/selected-date.ts` | Add `setSwipeDirection` / `getSwipeDirection` helpers using `sessionStorage` |
| `src/hooks/useSwipeNavigation.ts` | Write direction to `sessionStorage` before firing callbacks |
| `src/pages/FoodLog.tsx` | Read direction on mount, apply animation class to outer div |
| `src/pages/WeightLog.tsx` | Same as FoodLog |
| `src/pages/OtherLog.tsx` | Same as FoodLog |
| `src/pages/History.tsx` | Add `slideDir` state, guarded next-month, keyed animated grid div |

---

### What it will feel like

- **Swipe right (go back a day/month)**: content slides in from the left — feels like turning back
- **Swipe left (go forward a day/month)**: content slides in from the right — feels like turning forward
- **Tapping the chevron buttons**: same directional animation fires
- **Trying to swipe forward on the current month in History**: silently does nothing
- **Duration**: 200ms ease-out — snappy but clearly visible
- **No jank**: the direction is set synchronously before the URL update, so the animation class is applied on the very first render frame of the new content
