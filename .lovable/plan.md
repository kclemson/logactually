
# Debug and fix: dayClassification charts rendering empty

## What we know
- The v2 DSL is generated correctly with `groupBy: "dayClassification"` and `classify.rule: "only_keys"`
- The database has valid data (walking-only days exist: Jan 24, 26, 30, Feb 7, 19, 20)
- The chart card renders (title, aiNote visible) but with zero bars
- No console errors are thrown
- The `only_keys` logic and `tokensToEvaluate` fix are correct in source code

## Root cause hypothesis
Since the logic traces perfectly on paper but produces empty output at runtime, the most likely cause is that `dailyTotals.exerciseKeysByDate` is `undefined` or `{}` when `executeDSL` runs. This could happen if:
1. The build hasn't fully deployed the latest chart-data.ts changes that populate `exerciseKeysByDate`
2. A subtle runtime issue strips the property during object transfer

## Plan

### Step 1: Add diagnostic console.log in executeDSL
Add a temporary log at the top of the `dayClassification` case in `src/lib/chart-dsl.ts` to expose the actual runtime state:

```ts
case "dayClassification": {
  const classify = dsl.classify;
  if (!classify) break;
  console.log("[dayClassification] exerciseKeysByDate keys:", Object.keys(dailyTotals.exerciseKeysByDate ?? {}), "classify:", classify.rule);
  // ... rest of logic
```

This will immediately reveal whether `exerciseKeysByDate` is empty at runtime.

### Step 2: Add diagnostic log in fetchExerciseData return
Add a log in `src/lib/chart-data.ts` right before the return statement to confirm the data is populated at fetch time:

```ts
console.log("[chart-data] exerciseKeysByDate sample:", Object.keys(exerciseKeysByDate).slice(0, 3), "total dates:", Object.keys(exerciseKeysByDate).length);
return { food: {}, exercise, exerciseByHour, exerciseByItem, exerciseByCategory, exerciseKeysByDate };
```

### Step 3: Test and identify the gap
Generate a dayClassification chart and check the console:
- If chart-data log shows populated data but executeDSL log shows empty -- the property is lost in transit
- If chart-data log also shows empty -- there's a bug in the seenKeys loop
- If both show data -- the issue is elsewhere (sorting/limiting/rendering)

### Step 4: Fix based on findings
Apply the targeted fix once the root cause is identified from the logs.

### Step 5: Remove diagnostic logs
Clean up the temporary console.log statements after the fix is confirmed working.
