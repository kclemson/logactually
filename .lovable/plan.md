# Calendar Monthly Log-Day Summary

Add a compact summary below the month header on the Calendar page that shows how many days in the current month had food logs and how many had exercise logs.

## What will change

- In `src/pages/History.tsx`, add a small centered summary row between the month navigation and the calendar grid.
- The row will display two counts for the currently viewed month only:
  - **Food:** number of days with at least one food entry
  - **Exercise:** number of days with at least one exercise/weight entry
- Use existing thematic colors: blue tint for food, purple tint for exercise.
- Keep styling compact and muted so it does not compete with the calendar cells.

## Example display

```text
Food: 12 days · Exercise: 8 days
```

## Technical approach

- Derive the counts from data already fetched for the calendar:
  - Food days: count unique `eaten_date` values in `daySummaries` that fall within `currentMonth`.
  - Exercise days: count unique `logged_date` values in `weightSummaries` that fall within `currentMonth`.
- Use `isSameMonth(day, currentMonth)` to exclude padding days from adjacent months.
- No backend or schema changes are required.
- Only `src/pages/History.tsx` will be modified.
