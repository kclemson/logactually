
## Show Full Date Range for Text-Type Custom Log Charts

Currently, text-type charts (Mood, Journal) only show X-axis dates that have logged data. To show logging density properly, the X-axis should span all days in the selected time period (7, 14, 30, etc.), with bars only appearing on days that have entries.

### Changes

**1. Pass `days` to `CustomLogTrendChart` (`src/pages/Trends.tsx`)**

- Add a `days` prop to the component (around line 426).
- When rendering `CustomLogTrendChart` (around line 956), pass `selectedPeriod` as `days`.

**2. Use full date range for text types (`src/pages/Trends.tsx`, lines 427-457)**

- For `text` and `text_multiline` value types, instead of building `dates` from only the data points, generate the complete list of dates from `today - (days-1)` through `today`.
- For all other value types, keep the existing behavior (only dates with data).

The updated `chartData` builder logic (inside `useMemo`) will look like:

```typescript
const chartData = useMemo(() => {
  const isTextType = trend.valueType === 'text' || trend.valueType === 'text_multiline';
  
  let dates: string[];
  if (isTextType && days) {
    // Full date range for density view
    const today = startOfDay(new Date());
    dates = [];
    for (let i = days - 1; i >= 0; i--) {
      dates.push(format(subDays(today, i), 'yyyy-MM-dd'));
    }
  } else {
    // Existing: only dates with data
    const dateSet = new Set<string>();
    trend.series.forEach(s => s.data.forEach(d => dateSet.add(d.date)));
    dates = Array.from(dateSet).sort();
  }

  // ... rest of label interval + mapping logic unchanged
}, [trend, days]);
```

This requires importing `startOfDay` and `subDays` from `date-fns` (both are already imported at the top of the file).

### Summary of touched code

| File | What changes |
|------|-------------|
| `src/pages/Trends.tsx` | Add `days` prop to `CustomLogTrendChart`, generate full date range for text types, pass `selectedPeriod` when rendering the component |
