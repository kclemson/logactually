

## Add Exercise Details to Preview Labels

### Problem
The preview currently shows only exercise names (e.g., "Treadmill Walk", "Leg Curl") with no context about the specific workout parameters being used for the estimate.

### Solution
Update the `exerciseLabel` function and preview rendering to show contextual details:
- **Cardio**: duration and/or distance (e.g., "Treadmill Walk -- 25 min" or "Treadmill Run -- 30 min, 3.1 mi")
- **Strength**: sets x reps x weight in user's preferred unit (e.g., "Leg Curl -- 3x10 @ 60 lbs" or "Leg Curl -- 3x10 @ 27 kg")

### Changes (`CalorieBurnDialog.tsx`)

1. **Update `exerciseLabel` to accept `weightUnit`** and build a detail suffix:
   - For cardio (duration > 0): show duration, plus distance if available
   - For strength (sets > 0): show sets x reps, plus weight converted to user's unit if > 0
   - Use an em dash separator between name and details

2. **Update the `previews` useMemo** to pass `settings.weightUnit` into the label builder and add it to the dependency array.

3. **Update `SAMPLE_LABELS`** to remove the hardcoded labels map entirely -- the dynamic `exerciseLabel` function will handle all cases including samples, so duplicating labels is unnecessary.

### Technical Details

The label function will look like:

```
function exerciseLabel(ex: ExerciseInput, weightUnit: WeightUnit): string {
  const name = 'description' in ex && (ex as any).description
    ? (ex as any).description
    : ex.exercise_key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const details: string[] = [];

  if (ex.duration_minutes && ex.duration_minutes > 0) {
    details.push(`${ex.duration_minutes} min`);
  }
  if (ex.distance_miles && ex.distance_miles > 0) {
    details.push(`${ex.distance_miles.toFixed(1)} mi`);
  }
  if (ex.sets > 0) {
    let s = `${ex.sets}x${ex.reps}`;
    if (ex.weight_lbs > 0) {
      const w = weightUnit === 'kg'
        ? Math.round(ex.weight_lbs * 0.453592)
        : ex.weight_lbs;
      s += ` @ ${w} ${weightUnit}`;
    }
    details.push(s);
  }

  return details.length ? `${name} — ${details.join(', ')}` : name;
}
```

The `previews` useMemo will merge the description logic into the label call and depend on `settings.weightUnit`.

### Files Changed
- `src/components/CalorieBurnDialog.tsx` only
