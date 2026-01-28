

## Calendar Integration for Weight Tracking

### Overview
Integrate weight training data into the Calendar/History page. Days with workouts will show a dumbbell icon indicator alongside calorie totals, allowing users to see their training frequency at a glance.

---

### Design Decisions

**Visual approach:**
- Keep existing calorie display (rose/pink theme)
- Add a small dumbbell icon for days with weight entries
- Show exercise count on hover/tooltip (future enhancement)
- Both indicators can appear on the same day (ate food AND worked out)

**Navigation behavior:**
- Current: Always navigates to FoodLog (`/` or `/?date=xxx`)
- New: If weight tracking is enabled AND day has weights, show both options or default to food with easy switch
- For simplicity: Keep current navigation to FoodLog, add a small visual indicator that the day also has workouts

**Why this approach:**
- Non-intrusive: Doesn't change existing UX for food tracking
- Informative: Users can see workout frequency patterns
- Consistent: Uses the same calendar grid, just adds weight data layer
- Feature-gated: Only visible when `FEATURES.WEIGHT_TRACKING` is enabled

---

### UI Layout

```text
Calendar Grid Cell:
+------------------+
|   1,850 cal      |  <- Calorie count (existing, rose color)
|       15         |  <- Day number
|    🏋️           |  <- Dumbbell icon if workouts logged (purple)
+------------------+

Alternative compact layout:
+------------------+
|   1,850 🏋️       |  <- Calories + workout indicator on same line
|       15         |  <- Day number centered
+------------------+
```

---

### Changes

#### 1. Update History Page

**File:** `src/pages/History.tsx`

Add weight data query and visual indicators:

```typescript
import { Dumbbell } from 'lucide-react';
import { FEATURES } from '@/lib/feature-flags';

interface DaySummary {
  date: string;
  totalCalories: number;
  entryCount: number;
}

interface WeightDaySummary {
  date: string;
  exerciseCount: number;
}

// Inside History component, add weight query:
const { data: weightSummaries = [] } = useQuery({
  queryKey: ['weight-entries-summary', format(monthStart, 'yyyy-MM')],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('weight_sets')
      .select('logged_date')
      .gte('logged_date', format(monthStart, 'yyyy-MM-dd'))
      .lte('logged_date', format(monthEnd, 'yyyy-MM-dd'));

    if (error) throw error;

    // Count unique entries per date
    const countMap = new Map<string, number>();
    (data || []).forEach((entry) => {
      countMap.set(entry.logged_date, (countMap.get(entry.logged_date) || 0) + 1);
    });

    return Array.from(countMap.entries()).map(([date, count]) => ({
      date,
      exerciseCount: count,
    }));
  },
  enabled: FEATURES.WEIGHT_TRACKING,
});

// Add weight lookup map
const weightByDate = useMemo(() => {
  const map = new Map<string, WeightDaySummary>();
  weightSummaries.forEach((s) => map.set(s.date, s));
  return map;
}, [weightSummaries]);

// In the calendar cell render:
const hasWeights = FEATURES.WEIGHT_TRACKING && !!weightByDate.get(dateStr);

// Update cell styling to include purple tint when weights exist:
<button
  className={cn(
    "flex flex-col items-center justify-center p-2 min-h-[68px] rounded-xl transition-colors",
    // ... existing conditions ...
    hasWeights && hasEntries && !isFutureDate && "bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-900/20 dark:to-purple-900/20",
    hasWeights && !hasEntries && !isFutureDate && "bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-800/30",
  )}
>
  {/* Existing calorie display */}
  {hasEntries && isCurrentMonth && (
    <span className="text-rose-500 dark:text-rose-400 font-medium">
      {Math.round(summary.totalCalories).toLocaleString()}
    </span>
  )}
  
  {/* Day number */}
  <span className={cn("font-medium", /* existing conditions */)}>
    {format(day, 'd')}
  </span>
  
  {/* Weight indicator */}
  {hasWeights && isCurrentMonth && (
    <Dumbbell className="h-3 w-3 text-purple-500 dark:text-purple-400" />
  )}
</button>
```

---

### Visual States Summary

| Day State | Background | Top Text | Icon |
|-----------|------------|----------|------|
| Food only | Rose | Calories (rose) | None |
| Weights only | Purple | None | Dumbbell (purple) |
| Both food + weights | Rose-to-purple gradient | Calories (rose) | Dumbbell (purple) |
| No entries | Muted gray | None | None |
| Future | Muted/disabled | None | None |

---

### Files Summary

| File | Action |
|------|--------|
| `src/pages/History.tsx` | Modify - add weight data query and visual indicators |

---

### Technical Notes

- Uses same query pattern as food entries (aggregate by date)
- Weight query is `enabled: FEATURES.WEIGHT_TRACKING` to avoid unnecessary fetches
- Gradient background for days with both food and weights creates a nice visual blend
- Dumbbell icon uses same sizing pattern as existing calendar elements
- No navigation changes needed - users can still navigate to FoodLog and then switch to WeightLog if desired
- Future enhancement: Add tooltip showing exercise count on hover

