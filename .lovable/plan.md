

## Highlight Days with Data in Date Picker

Add visual indicators in the date picker calendar to show which days have logged data.

---

### Current State

The Calendar component in both Log Food and Log Weights pages shows a plain calendar with no indication of which dates have data logged.

### Desired Result

- **Log Food**: Days with food entries show in a distinct color (e.g., blue text)
- **Log Weights**: Days with weight entries show in a distinct color (e.g., purple text)

---

### Technical Approach

Use react-day-picker's `modifiers` and `modifiersClassNames` props to apply custom styling to dates with data. The Calendar component already uses DayPicker.

**react-day-picker v8 supports:**
```tsx
<DayPicker
  modifiers={{ hasData: [date1, date2, date3] }}
  modifiersClassNames={{ hasData: "text-blue-600" }}
/>
```

---

### Data Fetching Strategy

Create a new hook that fetches dates with data for the visible month range. Query is lightweight since we only need the date column:

**For Food (FoodLog):**
```sql
SELECT DISTINCT eaten_date FROM food_entries
WHERE eaten_date >= 'month-start' AND eaten_date <= 'month-end'
```

**For Weights (WeightLog):**
```sql
SELECT DISTINCT logged_date FROM weight_sets
WHERE logged_date >= 'month-start' AND logged_date <= 'month-end'
```

---

### Implementation Plan

**1. Create `src/hooks/useDatesWithData.ts`**

A new hook to fetch dates with entries for a given month:

```typescript
export function useFoodDatesWithData(month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  
  return useQuery({
    queryKey: ['food-dates', format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data } = await supabase
        .from('food_entries')
        .select('eaten_date')
        .gte('eaten_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('eaten_date', format(monthEnd, 'yyyy-MM-dd'));
      
      // Return unique dates as Date objects
      const dates = [...new Set(data?.map(e => e.eaten_date) ?? [])];
      return dates.map(d => new Date(`${d}T12:00:00`)); // Avoid timezone shift
    },
  });
}

export function useWeightDatesWithData(month: Date) {
  // Similar for weight_sets table using logged_date
}
```

**2. Update `src/pages/FoodLog.tsx`**

Track the currently displayed calendar month and pass modifiers:

```tsx
const [calendarMonth, setCalendarMonth] = useState(new Date());
const { data: datesWithFood = [] } = useFoodDatesWithData(calendarMonth);

<Calendar
  mode="single"
  selected={selectedDate}
  onSelect={handleDateSelect}
  onMonthChange={setCalendarMonth}
  disabled={(date) => isFuture(date)}
  modifiers={{ hasData: datesWithFood }}
  modifiersClassNames={{ hasData: "text-blue-600 dark:text-blue-400 font-semibold" }}
  initialFocus
  className="pointer-events-auto"
/>
```

**3. Update `src/pages/WeightLog.tsx`**

Same pattern with weight data:

```tsx
const [calendarMonth, setCalendarMonth] = useState(new Date());
const { data: datesWithWeights = [] } = useWeightDatesWithData(calendarMonth);

<Calendar
  modifiers={{ hasData: datesWithWeights }}
  modifiersClassNames={{ hasData: "text-purple-600 dark:text-purple-400 font-semibold" }}
  // ... other props
/>
```

---

### Visual Result

```text
┌─────────────────────────────────────┐
│           January 2026              │
│  Su  Mo  Tu  We  Th  Fr  Sa         │
│                  1   2   3          │
│   4   5   6   7   8   9  10         │
│  11  12  13  14  15  16  17         │  (14, 21, 28 in blue = has food data)
│  18  19  20  21  22  23  24         │
│  25  26  27 [28]                    │
└─────────────────────────────────────┘
```

---

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/hooks/useDatesWithData.ts` | New hook with `useFoodDatesWithData` and `useWeightDatesWithData` |
| `src/pages/FoodLog.tsx` | Add calendar month state, fetch food dates, pass modifiers |
| `src/pages/WeightLog.tsx` | Add calendar month state, fetch weight dates, pass modifiers |

---

### Edge Cases

| Case | Handling |
|------|----------|
| Month navigation | `onMonthChange` callback updates state, triggers new query |
| Initial load | Default to current month |
| Timezone | Use `T12:00:00` when parsing dates to avoid off-by-one errors |
| Selected date styling | Selected day styling (`day_selected`) takes precedence, which is correct |

---

### Performance

- Query runs once per month navigation (cached by react-query)
- Only fetches date column, no heavy data
- Data is reused if user navigates back to same month

