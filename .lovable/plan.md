
## Plan: White Date Header with Underline + Calendar Month Initialization

### Overview
Three changes are needed:
1. Style the date header ("Wed, Feb 4") as white text with an underline
2. Keep the existing underline on the selected date in the calendar picker (already done)
3. Initialize the calendar picker to show the month of the currently selected date

---

### Part 1: White Date Header with Underline

**Files**: `src/pages/FoodLog.tsx` and `src/pages/WeightLog.tsx`

Both pages have identical date header styling around line 684-692 (FoodLog) and 600-610 (WeightLog):

**Current (FoodLog line 684-692)**:
```tsx
<button
  className={cn(
    "flex items-center gap-1.5 px-2 py-1 text-heading hover:underline",
    "text-blue-600 dark:text-blue-400"
  )}
>
  <CalendarIcon className="h-4 w-4" />
  {format(selectedDate, isTodaySelected ? "'Today,' MMM d" : 'EEE, MMM d')}
</button>
```

**After fix**:
```tsx
<button
  className={cn(
    "flex items-center gap-1.5 px-2 py-1 text-heading",
    "text-white underline decoration-2 underline-offset-4"
  )}
>
  <CalendarIcon className="h-4 w-4" />
  {format(selectedDate, isTodaySelected ? "'Today,' MMM d" : 'EEE, MMM d')}
</button>
```

Changes:
- Remove `hover:underline` (always show underline instead)
- Remove blue color classes
- Add white text with underline styling matching the calendar's selected day style

---

### Part 2: Initialize Calendar Month from Selected Date

**Files**: `src/pages/FoodLog.tsx` and `src/pages/WeightLog.tsx`

Both pages initialize `calendarMonth` to the current month instead of the selected date's month:

**FoodLog line 48** and **WeightLog line 64**:
```tsx
const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
```

**After fix**:
```tsx
const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(selectedDate));
```

This ensures when viewing Jan 1 and clicking the date header, the calendar shows January instead of the current month (February).

---

### Summary of Changes

| File | Line | Change |
|------|------|--------|
| `src/pages/FoodLog.tsx` | 48 | Initialize `calendarMonth` from `selectedDate` |
| `src/pages/FoodLog.tsx` | 685-688 | White text with underline styling |
| `src/pages/WeightLog.tsx` | 64 | Initialize `calendarMonth` from `selectedDate` |
| `src/pages/WeightLog.tsx` | 601-604 | White text with underline styling |

### Visual Result
- Date header displays in white with a subtle underline (matching the selected day in calendar)
- Calendar popover opens showing the month of the date you're viewing
- Users can still use "Go to Today" to quickly jump to the current month
