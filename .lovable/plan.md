
## Fix: Swipe gesture allows navigating into the future on log pages

### Root cause

`goToNextDay` in `useDateNavigation.ts` has no guard against advancing past today. The `>` chevron button is protected separately via `disabled={isTodaySelected}` in `DateNavigation.tsx`, but the swipe gesture calls `goToNextDay` directly, bypassing that button entirely.

The History page handles this correctly with a `goToNextMonthGuarded` function:

```ts
const goToNextMonthGuarded = () => {
  if (isSameMonth(currentMonth, new Date())) return; // guard
  ...
};
```

The log pages have no equivalent guard in their swipe handler.

### The fix

Add one guard line inside `goToNextDay` in `useDateNavigation.ts`:

```ts
const goToNextDay = () => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentStr = format(selectedDate, 'yyyy-MM-dd');
  if (currentStr >= todayStr) return; // already on today or future — do nothing
  ...rest of existing logic...
};
```

This single change fixes all three log pages (Food, Weight, Custom) simultaneously because they all share the same hook. No changes needed to the pages or the swipe handler itself.

### Files changed

| File | Change |
|---|---|
| `src/hooks/useDateNavigation.ts` | Add a today-guard at the top of `goToNextDay` |

This is a one-line fix in one file. Zero risk.
