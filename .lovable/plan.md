
## Bug: `?date=undefined` crashes the Weight (and Food/Other) log page

### Root cause

When a URL like `/weights?date=undefined` is loaded, `searchParams.get('date')` returns the **literal string `"undefined"`** — not JS `undefined`. Because `"undefined"` is truthy, this line:

```ts
const dateKey = dateParam || getStoredDate() || format(new Date(), 'yyyy-MM-dd');
```

passes `"undefined"` straight through as `initialDate`. That string then reaches:

- `parseISO("undefined")` → invalid Date object
- `useWeightDatesWithData(calendarMonth)` → `format(invalidDate, ...)` → **`RangeError: Invalid time value`** → ErrorBoundary crash

This is a defensive-coding gap that exists in all three log pages identically. It was exposed by the recent swipe animation change, which added a `setSearchParams` call path that somehow serialised `undefined` as the string `"undefined"` in at least one navigation scenario.

### The fix — 3 lines across 3 files

Add a guard that rejects the literal string `"undefined"` (and any other non-date-looking value) before it reaches `parseISO`. The cleanest approach is:

```ts
// Reject the literal string "undefined" that URLSearchParams can produce
const validDateParam = dateParam && dateParam !== 'undefined' ? dateParam : null;
const dateKey = validDateParam || getStoredDate() || format(new Date(), 'yyyy-MM-dd');
```

This gracefully falls through to `getStoredDate()` or today when the param is absent, null, or the string `"undefined"`.

### Files changed

| File | Line | Change |
|---|---|---|
| `src/pages/WeightLog.tsx` | 38-39 | Add `validDateParam` guard before the `||` chain |
| `src/pages/FoodLog.tsx` | 38-39 | Same guard |
| `src/pages/OtherLog.tsx` | 33-34 | Same guard |

No logic changes, no new state, no component restructuring — purely defensive input sanitisation on three identical lines.
