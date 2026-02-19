

## Two improvements: verifiable meal counts + better suggestion chips

### 1. Make "meals per day" verifiable

Currently the AI returns `verification: null` for meal-count charts because `entries` isn't tracked in daily totals. The edge function already loops through `foodEntries` -- we just need to count rows per date.

**`supabase/functions/generate-chart/index.ts`:**
- Add `entries: 0` to the daily food totals accumulator type
- Increment `entries` once per `food_entries` row (not per item)
- Include `entries` in the daily food summary string sent to the AI
- Include `entries` in the serialized food totals sent to the client
- Update the system prompt's field list: `Food: cal, protein, carbs, fat, fiber, sugar, sat_fat, sodium, chol, entries`
- Add a note: `entries = number of food log entries (meals) for that date`

**`src/lib/chart-verification.ts`:**
- Add to `FOOD_KEY_MAP`: `entries: "entries"`, `meals: "entries"`, `meal_count: "entries"`, `meal_entries: "entries"`

### 2. Improve suggestion chips

Keep existing useful prompts (fiber, sodium, sugar), remove redundant/low-value ones, and add more insight-driven prompts. The goal is a mix of "obvious useful" basics and "aha moment" analytical questions.

**`src/components/CustomChartDialog.tsx` -- replace `ALL_CHIPS`:**

Keeping (basics that users will want):
- "Daily fiber intake over time"
- "Sodium intake trend"
- "Average sugar per day"
- "My highest calorie days"

Keeping (already good analytical prompts):
- "Average calories by hour of day"
- "Which day of the week do I eat the most?"
- "How many meals do I log per day on average?"
- "Average calories on workout days vs rest days"
- "Exercise frequency by day of week"
- "Which exercises do I do most often?"
- "Calorie comparison: weekdays vs weekends"

Removing (redundant or low-value):
- "Fat as percentage of total calories over time" (too niche for a chip)
- "Protein to calorie ratio over time" (similar to above)
- "Days where I exceeded 2000 calories" (too specific a number)
- "Average protein on workout days vs rest days" (very similar to calorie version)
- "Do I eat more on days I exercise?" (same as workout vs rest days)
- "Average carbs on weekdays vs weekends" (similar to calorie weekday/weekend)
- "Total exercise duration per week" (generic)
- "How many days per week did I exercise?" (similar to exercise frequency)
- "Training volume trend over time" (vague)

Adding (insight-driven):
- "Weekly calorie average trend" (smoothed view, very popular request)
- "How consistent is my logging?" (days with entries -- adherence tracking)
- "Protein per meal over time" (quality-per-meal insight)
- "Which meals have the most calories?" (identify problem meals)
- "My most common foods" (self-awareness)
- "Cardio vs strength training split" (exercise balance)
- "Average heart rate by exercise" (if they track it)
- "Rest days between workouts" (recovery insight)

Final list of ~20 chips, balanced between basics and insights.

### Files changed

| File | Change |
|---|---|
| `supabase/functions/generate-chart/index.ts` | Add `entries` count to daily food totals, summary, serialization, and system prompt |
| `src/lib/chart-verification.ts` | Add `entries`/`meals`/`meal_count` to FOOD_KEY_MAP |
| `src/components/CustomChartDialog.tsx` | Replace ALL_CHIPS with curated strategic list |

