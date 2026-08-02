# Calendar Monthly Log-Day Summary

Add a compact summary below the month header on the Calendar page that shows how many days in the current month had food logs and exercise logs, with a parenthetical breakdown of exercise by strength and cardio.

## What will change

- In `src/pages/History.tsx`, add a small centered summary row between the month navigation and the calendar grid.
- The row will display counts for the currently viewed month only:
  - **Food:** number of days with at least one food entry
  - **Exercise:** total number of days with any exercise entry, followed by a breakdown in parentheses
    - **strength:** days with lifting/strength entries
    - **cardio:** days with run/walk or cycling entries
- Use existing thematic colors: blue for food, purple tones for exercise.
- Keep styling compact and muted so it does not compete with the calendar cells.

## Example display

```text
Food: 12 days · Exercise: 8 (strength: 5, cardio: 4)
```

## Technical approach

- Derive the counts from data already fetched for the calendar:
  - Food days: count unique `eaten_date` values in `daySummaries` that fall within `currentMonth`.
  - Total exercise days: count unique `logged_date` values in `weightSummaries` that fall within `currentMonth`.
  - Strength days: count days where `hasLifting` is true.
  - Cardio days: count days where `hasRunWalk` or `hasCycling` is true.
- Use `isSameMonth(day, currentMonth)` to exclude padding days from adjacent months.
- No backend or schema changes are required.
- Only `src/pages/History.tsx` will be modified.


