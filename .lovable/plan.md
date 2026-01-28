

## Weight Trends: Default 6-Chart Grid with Dropdown for More

### Overview
Instead of requiring users to select an exercise before seeing any data, display the 6 most frequently logged exercises as individual charts by default. A dropdown allows users to view any additional exercises beyond the top 6.

---

### UI Layout

```text
Weight Trends (collapsible)
+--------------------------------------------------+
|  Row 1: 2 charts side-by-side                    |
|  +---------------------+  +---------------------+|
|  | Lat Pulldown        |  | Bench Press         ||
|  | [Line chart: lbs]   |  | [Line chart: lbs]   ||
|  +---------------------+  +---------------------+|
|                                                  |
|  Row 2: 2 charts side-by-side                    |
|  +---------------------+  +---------------------+|
|  | Squat               |  | Leg Press           ||
|  | [Line chart: lbs]   |  | [Line chart: lbs]   ||
|  +---------------------+  +---------------------+|
|                                                  |
|  Row 3: 2 charts side-by-side                    |
|  +---------------------+  +---------------------+|
|  | Seated Row          |  | Shoulder Press      ||
|  | [Line chart: lbs]   |  | [Line chart: lbs]   ||
|  +---------------------+  +---------------------+|
|                                                  |
|  [ More exercises... ▼ ]  <- Dropdown for others |
|  (Shows remaining exercises not in top 6)        |
+--------------------------------------------------+
```

---

### Changes

#### 1. Create Weight Trends Hook

**New file:** `src/hooks/useWeightTrends.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, startOfDay } from 'date-fns';

interface DailyProgress {
  date: string;
  maxWeight: number;
  totalVolume: number;
  totalSets: number;
}

interface ExerciseTrend {
  exercise_key: string;
  description: string;
  sessionCount: number;
  maxWeight: number;
  dailyData: DailyProgress[];
}

export function useWeightTrends(days: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weight-trends', days, user?.id],
    queryFn: async () => {
      if (!user) return [];

      const startDate = format(
        subDays(startOfDay(new Date()), days - 1),
        'yyyy-MM-dd'
      );

      const { data, error } = await supabase
        .from('weight_sets')
        .select('exercise_key, description, sets, reps, weight_lbs, logged_date')
        .gte('logged_date', startDate)
        .order('logged_date', { ascending: true });

      if (error) throw error;

      // Aggregate by exercise_key
      const exerciseMap = new Map<string, ExerciseTrend>();

      (data || []).forEach(row => {
        const key = row.exercise_key;
        const weight = Number(row.weight_lbs);
        const volume = row.sets * row.reps * weight;

        if (!exerciseMap.has(key)) {
          exerciseMap.set(key, {
            exercise_key: key,
            description: row.description,
            sessionCount: 0,
            maxWeight: 0,
            dailyData: [],
          });
        }

        const trend = exerciseMap.get(key)!;
        trend.maxWeight = Math.max(trend.maxWeight, weight);

        // Aggregate by date
        const existing = trend.dailyData.find(d => d.date === row.logged_date);
        if (existing) {
          existing.maxWeight = Math.max(existing.maxWeight, weight);
          existing.totalVolume += volume;
          existing.totalSets += row.sets;
        } else {
          trend.dailyData.push({
            date: row.logged_date,
            maxWeight: weight,
            totalVolume: volume,
            totalSets: row.sets,
          });
        }
      });

      // Count sessions and sort by frequency
      const results = Array.from(exerciseMap.values());
      results.forEach(ex => {
        ex.sessionCount = ex.dailyData.length;
      });
      
      return results.sort((a, b) => b.sessionCount - a.sessionCount);
    },
    enabled: !!user,
  });
}
```

---

#### 2. Update Trends Page

**File:** `src/pages/Trends.tsx`

Add imports and Weight Trends section:

```typescript
// Add imports
import { Dumbbell, ChevronDown } from 'lucide-react';
import { LineChart, Line } from 'recharts';
import { FEATURES } from '@/lib/feature-flags';
import { useWeightTrends } from '@/hooks/useWeightTrends';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Inside Trends component, add state for dropdown selection
const [extraExercise, setExtraExercise] = useState<string | null>(null);

// Add weight trends query
const { data: weightExercises = [], isLoading: weightLoading } = useWeightTrends(selectedPeriod);

// Split into top 6 and remaining
const top6Exercises = weightExercises.slice(0, 6);
const remainingExercises = weightExercises.slice(6);
const selectedExtra = remainingExercises.find(e => e.exercise_key === extraExercise);

// Reusable chart component for exercise
const ExerciseChart = ({ exercise }: { exercise: ExerciseTrend }) => {
  const chartData = exercise.dailyData.map(d => ({
    ...d,
    date: format(new Date(d.date), 'MMM d'),
  }));

  return (
    <Card>
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-sm font-semibold flex justify-between">
          <span>{exercise.description}</span>
          <span className="text-muted-foreground font-normal">
            Max: {exercise.maxWeight} lbs
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 8 }}
                stroke="hsl(var(--muted-foreground))"
                interval="preserveStartEnd"
              />
              <Tooltip
                content={<CompactTooltip />}
                offset={20}
                cursor={{ stroke: 'hsl(var(--muted)/0.3)' }}
              />
              <Line
                type="monotone"
                dataKey="maxWeight"
                stroke="hsl(262 83% 58%)"
                strokeWidth={2}
                dot={{ fill: 'hsl(262 83% 58%)', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// In the JSX, after Food Trends section:
{FEATURES.WEIGHT_TRACKING && (
  <CollapsibleSection title="Weight Trends" icon={Dumbbell} defaultOpen={true}>
    {weightLoading ? (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    ) : weightExercises.length === 0 ? (
      <div className="py-8 text-center text-muted-foreground">
        No weight training data for this period
      </div>
    ) : (
      <div className="space-y-3 -ml-4">
        {/* Top 6 exercises in 2-column grid (3 rows) */}
        <div className="grid grid-cols-2 gap-3">
          {top6Exercises.map(exercise => (
            <ExerciseChart key={exercise.exercise_key} exercise={exercise} />
          ))}
        </div>

        {/* Dropdown for remaining exercises */}
        {remainingExercises.length > 0 && (
          <div className="space-y-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  {selectedExtra ? selectedExtra.description : 'More exercises...'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1 bg-popover z-50">
                <div className="flex flex-col gap-1">
                  {remainingExercises.map(ex => (
                    <Button
                      key={ex.exercise_key}
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => setExtraExercise(ex.exercise_key)}
                    >
                      {ex.description}
                      <span className="ml-auto text-muted-foreground text-xs">
                        {ex.sessionCount} sessions
                      </span>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Show selected extra exercise chart */}
            {selectedExtra && (
              <ExerciseChart exercise={selectedExtra} />
            )}
          </div>
        )}
      </div>
    )}
  </CollapsibleSection>
)}
```

---

### Files Summary

| File | Action |
|------|--------|
| `src/hooks/useWeightTrends.ts` | Create - fetches weight data and aggregates by exercise |
| `src/pages/Trends.tsx` | Modify - add Weight Trends section with 6 default charts + dropdown |

---

### Key Differences from Previous Plan

| Aspect | Previous Plan | New Plan |
|--------|---------------|----------|
| Default view | Nothing until exercise selected | 6 charts visible immediately |
| Exercise selection | Button row at top | Dropdown for overflow only |
| Chart layout | Single chart + summary cards | 2x3 grid matching Food Trends density |
| User action required | Yes (pick exercise first) | No (instant value) |

---

### Technical Notes

- Top 6 exercises are determined by `sessionCount` (most frequently logged)
- Uses same `CompactTooltip` and chart styling as Food Trends for consistency
- Line charts with dots work well for strength progression visualization
- Purple color (`hsl(262 83% 58%)`) differentiates weight from food charts
- Dropdown uses Popover with solid `bg-popover` background (not transparent)
- Feature-gated: entire section hidden when `FEATURES.WEIGHT_TRACKING` is false
- If user has fewer than 6 exercises logged, shows only what exists (no empty slots)

