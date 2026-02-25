

## Add "All Time" Period Option

### What changes

**Label choice:** "All time" reads well in the dropdown alongside "7 days", "30 days", "90 days". Clean and self-explanatory.

### Technical approach

Use a sentinel value (e.g. `0`) to represent "all time." When `period === 0`, compute the start date from the user's earliest database entry instead of `subDays(new Date(), period)`.

### Files to change

**1. `src/pages/Trends.tsx`**
- Add `{ label: "All time", days: 0 }` to the `periods` array
- Update the `useState` initializer whitelist: `[7, 30, 90, 0].includes(...)`
- The rest flows automatically — `selectedPeriod` is already threaded through every hook and component

**2. `src/lib/chart-data.ts`** (the DSL v2 data fetcher)
- When `period === 0`, set `startDate` to a far-past value like `"2000-01-01"` instead of computing `subDays(new Date(), 0)` (which would mean "today only")
- Add `.limit(10000)` to both the food and exercise queries as a safety net against unbounded result sets (default Supabase limit is 1,000 rows, which active users on "all time" will exceed)

**3. `src/hooks/useWeightTrends.ts`** (built-in exercise charts)
- Same pattern: when `days === 0`, use `"2000-01-01"` as start date
- Add `.limit(10000)` safety net

**4. `src/pages/Trends.tsx` food query** (~line 155)
- Same far-past date treatment for `period === 0`
- Add `.limit(10000)`

**5. `src/hooks/useDailyCalorieBurn.ts`** and **`src/hooks/useCustomLogTrends.ts`**
- Same pattern for any `subDays` usage

**6. `supabase/functions/generate-chart-dsl/index.ts`** (edge function)
- Update whitelist: `[7, 30, 90, 0].includes(period)`
- When `days === 0`, pass "all available data (no date limit)" to the AI prompt instead of "last 0 days"

**7. `supabase/functions/generate-chart/index.ts`** (v1 fallback)
- Same whitelist and date handling update

### Risk mitigation

The main risk is exceeding Supabase's default 1,000-row query limit on long histories. Adding explicit `.limit(10000)` on all queries prevents silent data truncation. For context, even a very active user logging 5 food entries and 3 exercises daily for 2 years would produce ~3,650 food rows and ~2,190 exercise rows — well within 10,000.

