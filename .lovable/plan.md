

## Reword the exercise log description in the generate-chart prompt to reduce strength-training bias

### Problem
The current system prompt describes the exercise log as:

> "Exercise log: dates, exercise names, sets, reps, weight (lbs), duration (minutes), distance (miles)..."

Leading with "sets, reps, weight" primes the AI to treat "exercise" as synonymous with weight lifting, causing it to exclude cardio and daily activities from charts like "Most Frequent Exercises."

### Fix

**Single file: `supabase/functions/generate-chart/index.ts`**

Replace the exercise log bullet in the `You have access to:` section (line 14) with something like:

```
- Exercise log: covers all types of physical activity -- strength training, cardio, sports, and everyday activities (e.g. walking, gardening). Fields: dates, exercise names, sets, reps, weight (lbs), duration (minutes), distance (miles), and metadata including heart rate, effort level, and reported calories burned. Not every exercise uses every field; cardio entries typically have duration/distance but no sets/reps/weight.
```

Key changes:
1. Opens with "covers all types of physical activity" and gives examples spanning strength, cardio, and everyday activity
2. Explicitly notes that not every exercise uses every field, so the AI won't filter out entries missing sets/reps/weight
3. Keeps the same field list so nothing is lost

No other files affected. The edge function will be redeployed automatically.
