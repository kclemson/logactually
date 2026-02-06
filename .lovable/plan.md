

## Plan: Fix "Cannot access 'selectedDate' before initialization" Error

### Problem
The last edit introduced a bug by using `selectedDate` in a `useState` initializer before `selectedDate` is declared. This causes a JavaScript temporal dead zone error.

**Current broken code (line 48):**
```tsx
const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(selectedDate));
// ...
const selectedDate = parseISO(initialDate); // selectedDate declared AFTER it's used!
```

### Solution
Use `initialDate` (which is available as a prop) and parse it inline:

```tsx
const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(parseISO(initialDate)));
```

### Files to Fix

| File | Line | Change |
|------|------|--------|
| `src/pages/FoodLog.tsx` | 48 | Change `selectedDate` → `parseISO(initialDate)` |
| `src/pages/WeightLog.tsx` | 64 | Same fix |

### Result
- Both pages will initialize without errors
- Calendar will correctly open to the month of the currently selected date
- No functional change in behavior, just fixes the variable ordering issue

