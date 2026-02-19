
## Fix "sessions" terminology in chart DSL prompt

### Problem

The `generate-chart-dsl` system prompt defines the `entries` metric as:
- Food: `entries (number of food logging sessions)`
- Exercise: `entries (number of exercise sessions logged ...)`

The AI uses this phrasing when writing chart titles and `aiNote` text, producing output like *"Average number of food and exercise logging sessions per day of week."* Users think of their logs as individual items they recorded, not "sessions," which implies a workout or app session.

### Fix

In `supabase/functions/generate-chart-dsl/index.ts`, update the two `entries` metric descriptions on lines 87–88:

**Before:**
```
entries (number of food logging sessions)
entries (number of exercise sessions logged — each logged group counts separately...)
```

**After:**
```
entries (number of food items logged)
entries (number of exercise items logged — each logged entry counts separately, not deduplicated by exercise type. Two separate dog walks = 2 entries.)
```

This causes the AI to naturally use phrasing like *"items logged"* or *"entries logged"* in generated titles and notes — language that matches how users think about their data.

### File changed

Only `supabase/functions/generate-chart-dsl/index.ts` — two lines in the AVAILABLE METRICS section. The edge function will be redeployed automatically.
