
# Remove future-date restrictions from navigation

## Summary
Allow users to navigate to dates in the future across all log pages, the calendar picker, the History page, and swipe gestures.

## Changes

### 1. `src/hooks/useDateNavigation.ts` -- Remove the today guard in `goToNextDay`
- Delete lines 18-20 (the `if (currentStr >= todayStr) return;` early exit)
- Simplify: always compute the next date and navigate, removing the special "clear params when reaching today" logic (just always set the date param)

### 2. `src/components/DateNavigation.tsx` -- Two changes
- **Calendar**: Remove `disabled={(date) => isFuture(date)}` on line 87 (allow selecting future dates)
- **Next-day chevron**: Remove `disabled={isTodaySelected}` on line 101 (allow clicking forward past today)

### 3. `src/lib/selected-date.ts` -- Allow future dates in storage
- In `getStoredDate()`, remove the `isFuture(parsed)` check on line 15 so a stored future date is preserved across page loads

### 4. `src/pages/History.tsx` -- Three changes
- **`goToNextMonthGuarded`**: Remove the `if (isSameMonth(currentMonth, new Date())) return;` guard so users can navigate to future months
- **Next-month chevron**: Remove the `disabled={isSameMonth(currentMonth, new Date())}` prop
- **Day cells**: Remove all the `isFutureDate` guards so future day cells are clickable and styled normally (not grayed out)
