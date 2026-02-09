

## Fix Calendar Picker Defaulting to Wrong Month

### Problem
When viewing a date in a past month (e.g., January) and clicking the date header to open the calendar picker, it shows the current real-world month (February) instead of the month of the selected date. The "days with food logged" blue indicators also don't show because the data query is tied to `calendarMonth`, which is out of sync.

### Root Cause
The `Calendar` component doesn't receive a controlled `month` prop, so react-day-picker defaults to today's month. While `calendarMonth` state is initialized correctly on mount, it's never reset when the popover re-opens.

### Fix (2 changes in `src/pages/FoodLog.tsx`)

1. **Reset `calendarMonth` when popover opens** -- Add an `onOpenChange` handler to the Popover that resets `calendarMonth` to the selected date's month whenever it opens.

2. **Pass `month` prop to Calendar** -- Add `month={calendarMonth}` so the calendar display is controlled by state rather than defaulting to today.

Same fix should also be applied to `src/pages/WeightLog.tsx` which has the identical pattern.

### Technical Details

**FoodLog.tsx** (and matching changes in WeightLog.tsx):

```tsx
// Popover -- add onOpenChange
<Popover open={calendarOpen} onOpenChange={(open) => {
  if (open) setCalendarMonth(startOfMonth(selectedDate));
  setCalendarOpen(open);
}}>

// Calendar -- add month prop
<Calendar
  mode="single"
  month={calendarMonth}
  selected={selectedDate}
  onSelect={handleDateSelect}
  onMonthChange={setCalendarMonth}
  ...
/>
```

Two files changed, minimal edits per file.
