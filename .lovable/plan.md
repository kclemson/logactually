
## Synchronize WeightLog and FoodLog UI Structure

### Overview
Align the WeightLog page with FoodLog's established patterns for total row positioning/styling and date formatting, while also adding the calendar picker dropdown to FoodLog.

---

### Changes

#### 1. WeightItemsTable - Move Totals to Top with Proper Styling

**File:** `src/components/WeightItemsTable.tsx`

**Current (line 162-208):** TotalsRow uses bottom-style (`border-t-2`) and is rendered at the bottom (line 426)

**Changes:**
- Add `totalsPosition` prop (default to `'top'`)
- Update TotalsRow styling to match FoodItemsTable:
  - When `top`: `bg-slate-200 dark:bg-slate-700 rounded py-1.5 border border-slate-300 dark:border-slate-600`
  - When `bottom`: `pt-1.5 border-t-2 border-slate-300 dark:border-slate-600`
- Render TotalsRow before items when position is `'top'`

#### 2. WeightLog - Fix Date Text Size

**File:** `src/pages/WeightLog.tsx`

**Current (around line 182):** Date button uses `text-lg font-medium`

**Change:** Replace with `text-heading` (14px semibold) to match FoodLog exactly

#### 3. FoodLog - Add Calendar Picker

**File:** `src/pages/FoodLog.tsx`

**Current (lines 498-520):** Plain text date display with arrow buttons

**Changes:**
- Add imports: `Calendar as CalendarIcon` from lucide-react, `Popover/PopoverContent/PopoverTrigger`, `Calendar`, `isFuture` from date-fns
- Add `calendarOpen` state
- Wrap date text in a Popover trigger button (styled as clickable hyperlink, same as WeightLog)
- Add PopoverContent with "Go to Today" button and Calendar component
- Add `handleDateSelect` function to navigate to selected date

---

### Code Snippets

**WeightItemsTable TotalsRow (updated):**
```tsx
const TotalsRow = () => (
  <div className={cn(
    'grid gap-0.5 items-center group',
    totalsPosition === 'top' && 'bg-slate-200 dark:bg-slate-700 rounded py-1.5 border border-slate-300 dark:border-slate-600',
    totalsPosition === 'bottom' && 'pt-1.5 border-t-2 border-slate-300 dark:border-slate-600',
    gridCols
  )}>
    {/* ... content */}
  </div>
);
```

**WeightLog date button (fix text size):**
```tsx
<button className={cn(
  "flex items-center gap-1.5 px-2 py-1 text-heading hover:underline",
  "text-blue-600 dark:text-blue-400"
)}>
```

**FoodLog calendar popover (new):**
```tsx
<Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
  <PopoverTrigger asChild>
    <button className="flex items-center gap-1.5 px-2 py-1 text-heading hover:underline text-blue-600 dark:text-blue-400">
      <CalendarIcon className="h-4 w-4" />
      {format(selectedDate, isTodaySelected ? "'Today,' MMM d" : 'EEE, MMM d')}
    </button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="center">
    <div className="p-2 border-b">
      <Button variant="ghost" size="sm" className="w-full justify-center text-blue-600" onClick={() => {
        setSearchParams({}, { replace: true });
        setCalendarOpen(false);
      }}>
        Go to Today
      </Button>
    </div>
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={handleDateSelect}
      disabled={(date) => isFuture(date)}
      initialFocus
      className="pointer-events-auto"
    />
  </PopoverContent>
</Popover>
```

---

### Files to Modify

1. `src/components/WeightItemsTable.tsx`
   - Add `totalsPosition` prop with `'top'` default
   - Update TotalsRow conditional styling
   - Move TotalsRow render before items when position is `'top'`

2. `src/pages/WeightLog.tsx`
   - Change date button class from `text-lg font-medium` to `text-heading`

3. `src/pages/FoodLog.tsx`
   - Add imports for Calendar, Popover, CalendarIcon, isFuture
   - Add `calendarOpen` state
   - Add `handleDateSelect` function
   - Replace plain date text with Popover-wrapped button matching WeightLog style

---

### Visual Result

| Component | Before | After |
|-----------|--------|-------|
| Weight totals | Bottom, border-top style | Top, highlighted card style |
| Weight date | Large `text-lg` | Matches FoodLog `text-heading` (14px) |
| Food date | Plain text, no picker | Blue hyperlink with calendar dropdown |
