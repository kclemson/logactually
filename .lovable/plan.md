

## DateNavigation Extraction + "Go to today" Color Fix

### What

Extract the duplicated date navigation bar (prev/next buttons, calendar popover, "Go to today" link) into a shared component and hook. Also fix the "Go to today" link color to use standard foreground text instead of accent colors.

### Clarification from review

- The `accentColor` prop is **only** for the highlighted day numbers inside the calendar dropdown (days that have logged data show as bold colored text). It does NOT affect dots or the bottom-nav calendar page.
- Month navigation for highlights already works correctly: each parent page fetches `datesWithData` based on `calendarMonth`, and `onMonthChange` updates that state, which triggers a re-fetch. The shared component receives `datesWithData` as a prop so this continues to work seamlessly when navigating to other months.

### Steps

1. **Create `src/hooks/useDateNavigation.ts`**
   - Encapsulates shared state: `calendarOpen`, `calendarMonth`
   - Encapsulates the three identical functions: `goToPreviousDay`, `goToNextDay`, `handleDateSelect`
   - Input: `initialDate: string`, `setSearchParams` from react-router
   - Returns all state and callbacks needed by the component

2. **Create `src/components/DateNavigation.tsx`**
   - Props:
     - `selectedDate`, `isTodaySelected`
     - `calendarOpen`, `onCalendarOpenChange`, `calendarMonth`, `onCalendarMonthChange`
     - `onPreviousDay`, `onNextDay`, `onDateSelect`, `onGoToToday`
     - `datesWithData: Date[]` -- passed through to the Calendar's `modifiers` prop
     - `highlightClassName: string` -- the Tailwind classes for highlighted days (e.g. `"text-blue-600 dark:text-blue-400 font-semibold"`)
   - Both "Go to today" elements use `text-foreground` (fixes the color bug)
   - Normalizes the FoodLog quirk (`opacity-20` on next button) to the simpler `disabled` pattern used by WeightLog and OtherLog
   - ~70 lines of shared JSX

3. **Update `src/pages/FoodLog.tsx`**
   - Remove `calendarOpen`, `calendarMonth` state, `goToPreviousDay`, `goToNextDay`, `handleDateSelect` (~30 lines)
   - Remove date nav JSX block (lines 704-775, ~70 lines)
   - Import and use `useDateNavigation` + `DateNavigation`
   - Pass `highlightClassName="text-blue-600 dark:text-blue-400 font-semibold"` and `datesWithData={datesWithFood}`
   - Parent keeps `useFoodDatesWithData(calendarMonth)` query -- `calendarMonth` comes from the hook

4. **Update `src/pages/WeightLog.tsx`**
   - Same refactor
   - Pass `highlightClassName="text-purple-600 dark:text-purple-400 font-semibold"` and `datesWithData={datesWithWeights}`
   - Parent keeps `useWeightDatesWithData(calendarMonth)` query

5. **Update `src/pages/OtherLog.tsx`**
   - Same refactor
   - Pass `highlightClassName="text-teal-600 dark:text-teal-400 font-semibold"` and `datesWithData={datesWithData}`
   - Parent keeps `useCustomLogDatesWithData(calendarMonth)` query

6. **Create `src/components/DateNavigation.test.tsx`**
   - Renders "Today" format when `isTodaySelected` is true
   - Renders weekday format for past dates
   - Disables next-day button when on today
   - Shows "Go to today" link only when not on today
   - Calls `onPreviousDay` / `onNextDay` / `onGoToToday` on clicks
   - Both "Go to today" elements use foreground color (no accent)

### Month navigation for highlights (no regression)

The data flow that ensures highlights work for any month is preserved:

```text
Parent page owns:
  calendarMonth (from useDateNavigation hook)
       |
       v
  useFoodDatesWithData(calendarMonth) --> datesWithData[]
       |
       v
  <DateNavigation datesWithData={datesWithData} onCalendarMonthChange={...} />
       |
       v
  <Calendar modifiers={{ hasData: datesWithData }} onMonthChange={onCalendarMonthChange} />
```

When the user navigates to a different month in the picker, `onMonthChange` fires, updating `calendarMonth` in the hook, which causes the parent's query to re-fetch data for that month. The component receives the new `datesWithData` and highlights update accordingly.

### "Go to today" color fix

| Location | Before | After |
|----------|--------|-------|
| Calendar popover button (all pages) | `text-blue-600 dark:text-blue-400` or `text-teal-600 dark:text-teal-400` | `text-foreground` |
| External shortcut (all pages) | `text-primary` | `text-foreground` |

### Net effect

- ~240 lines removed across three files
- Two new shared files (component + hook), both tested
- "Go to today" color bug fixed
- Month navigation for highlights continues to work for all months
- Zero behavioral changes otherwise

