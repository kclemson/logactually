# Calendar Monthly Log-Day Summary

Add a compact summary below the month header on the Calendar page that shows how many days in the current month had food logs and exercise logs, with exercise split into strength, cardio, and other.

## What will change

- In `src/pages/History.tsx`, add a small centered summary row between the month navigation and the calendar grid.
- The row will display counts for the currently viewed month only:
  - **Food:** number of days with at least one food entry
  - **Strength:** number of days with lifting/strength entries
  - **Cardio:** number of days with run/walk or cycling entries
  - **Other:** number of days with other cardio entries
- Use existing thematic colors: blue for food, purple tones for exercise categories.
- Keep styling compact and muted so it does not compete with the calendar cells.

## Example display

```text
Food: 12 days · Strength: 5 · Cardio: 4 · Other: 2
```

## Technical approach

- Derive the counts from data already fetched for the calendar:
  - Food days: count unique `eaten_date` values in `daySummaries` that fall within `currentMonth`.
  - Exercise categories: count unique `logged_date` values in `weightSummaries` based on the existing `WeightDaySummary` flags (`hasLifting`, `hasRunWalk`, `hasCycling`, `hasOtherCardio`).
  - Cardio combines `hasRunWalk` and `hasCycling`; Other uses `hasOtherCardio`; Strength uses `hasLifting`.
- Use `isSameMonth(day, currentMonth)` to exclude padding days from adjacent months.
- No backend or schema changes are required.
- Only `src/pages/History.tsx` will be modified.

