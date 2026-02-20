

# Shorten chart titles

## Problem

Chart titles like "Walking-Only vs. Other Workout Days" and "Logging Consistency by Day of Week" wrap to two lines in the card layout. The only guidance in both prompts is `"title should be concise and descriptive"`.

## Fix

Update the title guidance in both edge functions to enforce brevity:

**`supabase/functions/generate-chart-dsl/index.ts` (line 167)**

Change:
```
- title should be concise and descriptive
```
To:
```
- title should be short (under 5 words) and descriptive
```

**`supabase/functions/generate-chart/index.ts` (line 145)**

Same change:
```
- title should be short (under 5 words) and descriptive
```

## Why this works

Titles like "Daily Fiber Intake", "Exercise Category Split", and "Weekly Average Calories" already fit on one line and are under 5 words. The problematic ones ("Walking-Only vs. Other Workout Days" = 6 words, "Logging Consistency by Day of Week" = 6 words, "Estimated Calories from Fast Food Items" = 7 words) would be guided toward shorter forms like "Walking vs Workout Days", "Logging by Weekday", "Fast Food Calories".

Existing saved charts won't change -- this only affects newly generated titles.

