
## Add "calories remaining" to the food log tooltip — today only

### The user's feedback

> "Should the food log and summaries tell you the delta between your consumption and goal? I find myself doing this math in my head to determine my budget."

This is a great, low-effort improvement. The tooltip on the Total row of the food log already shows the calorie target math — adding a remaining line directly answers this without cluttering the main UI.

### What will change

A new line appears at the bottom of the daily section of the tooltip, **only when viewing today's date**:

```
remaining:  122 cal
```

- If calories remaining is **negative** (over target), it shows in rose/red: `over by 122 cal`
- If zero or positive, it shows in green: `122 cal remaining`
- It sits below the target equation, separated by a subtle divider — before the weekly section

### Why "today only"

- For past days, the day is done — "remaining" is meaningless (you can't eat more yesterday)
- The History page tooltip already uses `label` (e.g., "Mon") to show the day, and doesn't need this
- This matches how every fitness app handles it: remaining budget is a live, forward-looking number

### Technical approach

**Step 1 — `CalorieTargetTooltipContent.tsx`**

Add an optional `showRemaining?: boolean` prop. When true, render a new block after the target equation:

```tsx
{showRemaining && target > 0 && (() => {
  const remaining = target - intake;
  const isOver = remaining < 0;
  return (
    <>
      <div className="border-t border-border my-1 -mx-3" />
      <div className={`tabular-nums ${isOver ? 'text-rose-400' : 'text-green-400'}`}>
        {isOver
          ? `over by ${Math.abs(remaining).toLocaleString()} cal`
          : `${remaining.toLocaleString()} cal remaining`}
      </div>
    </>
  );
})()}
```

**Step 2 — `FoodItemsTable.tsx`**

Add an optional `isToday?: boolean` prop, and pass `showRemaining={isToday}` down to `CalorieTargetTooltipContent`.

**Step 3 — `FoodLog.tsx`**

Pass `isToday={isTodaySelected}` to the `FoodItemsTable` call (already has `isTodaySelected` in scope).

### Files changed

| File | Change |
|---|---|
| `src/components/CalorieTargetTooltipContent.tsx` | Add `showRemaining` prop; render remaining/over line with color coding after the target equation |
| `src/components/FoodItemsTable.tsx` | Add `isToday` prop; pass `showRemaining={isToday}` to tooltip |
| `src/pages/FoodLog.tsx` | Pass `isToday={isTodaySelected}` to `FoodItemsTable` |

No new hooks, no database changes, no new queries — all the data is already in the tooltip.
