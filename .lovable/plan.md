
## Root cause found: calendar is 100% buttons, so every swipe is cancelled on start

### Why History is different from the log pages

The `useSwipeNavigation` hook cancels any gesture that starts on an interactive element:

```ts
const INTERACTIVE_SELECTORS = 'input, button, select, textarea, [role="dialog"], ...';

const onTouchStart = (e) => {
  if (target.closest(INTERACTIVE_SELECTORS)) {
    cancelled.current = true;  // ← gesture immediately dead
    return;
  }
  ...
};
```

This is intentional on the log pages — it prevents taps on entry rows, inputs, and action buttons from accidentally triggering a swipe. On those pages, the user can start a swipe on the background area between entries, so the check doesn't get in the way.

**The calendar is different.** Every cell is a `<button>` element. The 7x5 or 7x6 grid tiles the entire swipe zone. There is no background gap to touch. So literally every touch starts on a button, `cancelled` is set to `true` immediately, and the gesture is dead before it begins.

### The fix: use a data attribute to mark the swipe container as exempt

The swipe zone `div` itself should be the swipe target. When the user touches a calendar day button and then moves their finger horizontally, the intent is to swipe — not to click that button. The `button` guard exists to protect things like the `+` add-entry button or the save/delete icons, not the calendar day cells themselves.

The solution is to **exempt the calendar day buttons from the interactive selector check** by marking them with a data attribute, and excluding that attribute from the selector. This way, day-cell buttons let swipes through, while truly interactive elements (inputs, dialogs, action buttons) still block swipes.

**Option A — data attribute on buttons (cleanest)**

Add `data-swipe-exempt` to each calendar day `<button>` in `History.tsx`:

```tsx
<button
  data-swipe-exempt
  key={index}
  onClick={...}
  ...
>
```

Then in the hook, check for this attribute before cancelling:

```ts
const target = e.target as Element;
const closest = target.closest(INTERACTIVE_SELECTORS);
if (closest && !closest.hasAttribute('data-swipe-exempt')) {
  cancelled.current = true;
  return;
}
```

**Option B — check if touch starts directly on the swipe container (simplest)**

Instead of filtering by element type, check whether the touch target is a *descendant of the swipe zone* that has the `data-swipe-exempt` attribute. Same effect, same one-line change to the hook.

**Option A is cleaner.** It's explicit, readable, and works for any page that uses the hook — if another page ever has a similar full-coverage button grid, the same attribute can be added.

### What changes

**`src/hooks/useSwipeNavigation.ts`** — update the `onTouchStart` check:

```ts
const target = e.target as Element;
const interactiveEl = target.closest(INTERACTIVE_SELECTORS);
if (interactiveEl && !interactiveEl.hasAttribute('data-swipe-exempt')) {
  cancelled.current = true;
  return;
}
```

**`src/pages/History.tsx`** — add `data-swipe-exempt` to the calendar day `<button>`:

```tsx
<button
  data-swipe-exempt
  key={index}
  onClick={() => !isFutureDate && handleDayClick(day, index)}
  disabled={isFutureDate}
  className={cn(...)}
>
```

### Why this is safe

- The `data-swipe-exempt` attribute only appears on calendar day cells. All other buttons (the month nav chevrons, tooltip "Go to day →" link, settings buttons, etc.) remain protected by the interactive selector check.
- The day cell buttons still fire their `onClick` normally on a tap. The swipe hook only reads `onTouchEnd` to detect a swipe — if the finger barely moved, `absDX < MIN_SWIPE_X` catches it and no swipe fires.
- No changes to any log pages are required. This is a two-file change.

### Files changed

| File | Change |
|---|---|
| `src/hooks/useSwipeNavigation.ts` | Check `data-swipe-exempt` before cancelling on button touch |
| `src/pages/History.tsx` | Add `data-swipe-exempt` to the calendar day `<button>` |
