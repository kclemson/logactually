

## Pre-aggregate daily food and exercise totals in generate-chart

### Problem

The AI receives 1,700+ individual food item lines and must sum them to produce daily totals. It consistently fabricates the arithmetic. The same risk exists for exercise data.

### Solution

Compute daily summaries server-side in the edge function and prepend them to the data context. Keep item-level data for granular queries. Add one prompt instruction telling the AI to use the pre-computed totals.

### Changes

**`supabase/functions/generate-chart/index.ts`**

#### 1. Add daily food totals block (after building `foodContext`, before exercise)

After iterating food items into `foodContext`, aggregate daily totals:

```typescript
const dailyFoodTotals = new Map<string, { cal: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sat_fat: number; sodium: number; chol: number }>();
for (const e of foodEntries) {
  const items = e.food_items as any[];
  if (!Array.isArray(items)) continue;
  const t = dailyFoodTotals.get(e.eaten_date) || { cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sat_fat: 0, sodium: 0, chol: 0 };
  for (const item of items) {
    t.cal += item.calories || 0;
    t.protein += item.protein || 0;
    t.carbs += item.carbs || 0;
    t.fat += item.fat || 0;
    t.fiber += item.fiber || 0;
    t.sugar += item.sugar || 0;
    t.sat_fat += item.saturated_fat || 0;
    t.sodium += item.sodium || 0;
    t.chol += item.cholesterol || 0;
  }
  dailyFoodTotals.set(e.eaten_date, t);
}
```

Build a summary string from the map:

```
Daily food totals (pre-computed, authoritative):
2026-01-22: cal=3144, protein=95, carbs=199, fat=78, fiber=23, sugar=33, sat_fat=19, sodium=2456, chol=105
...
```

#### 2. Add daily exercise totals block (after building `exerciseContext`)

Aggregate per day: total sets logged, total duration, total distance, total calories burned, unique exercise count.

```typescript
const dailyExTotals = new Map<string, { sets: number; duration: number; distance: number; cal_burned: number; exercises: Set<string> }>();
for (const s of exerciseSets) {
  const t = dailyExTotals.get(s.logged_date) || { sets: 0, duration: 0, distance: 0, cal_burned: 0, exercises: new Set() };
  t.sets += 1;
  t.duration += s.duration_minutes || 0;
  t.distance += s.distance_miles || 0;
  const meta = s.exercise_metadata as any;
  t.cal_burned += meta?.calories_burned || 0;
  t.exercises.add(s.exercise_key);
  dailyExTotals.set(s.logged_date, t);
}
```

Build a summary string:

```
Daily exercise totals (pre-computed, authoritative):
2026-01-22: logged_sets=5, duration_min=45, distance_mi=3.2, cal_burned=320, unique_exercises=3
...
```

#### 3. Update context assembly

Place daily summaries before item-level data:

```typescript
const dataContext = [
  foodDailySummary,   // new
  foodContext,        // existing item-level
  exerciseDailySummary, // new
  exerciseContext,    // existing item-level
  customContext,
].filter(Boolean).join("\n\n");
```

#### 4. Add prompt instruction

Add to the DATA INTEGRITY section of `SYSTEM_PROMPT`:

```
- DAILY TOTALS sections are pre-computed and authoritative. For any query involving daily calorie/macro/exercise totals, use these values directly. Do NOT attempt to re-sum individual items for daily aggregation.
```

### Files changed

| File | Change |
|------|--------|
| `supabase/functions/generate-chart/index.ts` | Add ~40 lines of server-side daily aggregation for food and exercise; prepend summaries to context; add prompt instruction to use pre-computed totals |

