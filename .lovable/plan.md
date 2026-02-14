

## Add Realistic Trend Variation to Demo Custom Logs

### What changes

Replace the current simple linear interpolation (which always goes down) with a "wandering trend" approach that produces realistic-looking data: the overall direction is downward over the full period, but values occasionally rise for a few data points before resuming the decline.

### How the wandering trend works

Instead of `startValue - (progress * range) + tiny_noise`, use a cumulative random walk that's biased toward the target:

```text
For each data point:
  1. Calculate where the value "should" be (linear target)
  2. Apply a drift that nudges the current value toward the target
  3. Add a random step that can go up OR down
  4. Clamp so it doesn't go wildly out of range
```

This produces sequences like: 175, 174.2, 174.8, 175.3, 174.1, 173.5, 174.0, 172.8... -- clearly trending down but with natural-looking bumps upward.

### Technical details

**File: `supabase/functions/populate-demo-data/index.ts`**

Add a helper function (before the custom logs section) that generates a wandering series:

```typescript
function generateWanderingSeries(
  startVal: number,
  endVal: number,
  totalDays: number,
  intervalMin: number,
  intervalMax: number,
  stepSize: number,    // how much it can move per entry
  decimals: number,    // rounding precision
): Array<{ day: number; value: number }> {
  const results: Array<{ day: number; value: number }> = [];
  let current = startVal;
  let day = 0;
  while (day < totalDays) {
    const progress = day / totalDays;
    const target = startVal + (endVal - startVal) * progress;
    // Drift toward target + random walk
    const drift = (target - current) * 0.3;
    const noise = (Math.random() - 0.5) * stepSize;
    current += drift + noise;
    const factor = Math.pow(10, decimals);
    const rounded = Math.round(current * factor) / factor;
    results.push({ day, value: rounded });
    day += randomInt(intervalMin, intervalMax);
  }
  return results;
}
```

Then update each log type's generation to use this helper:

**Weight** (existing, lines 1019-1035):
- Replace linear formula with: `generateWanderingSeries(175, 165, totalDaysRange, 3, 4, 2.0, 1)`
- `stepSize: 2.0` means weight can fluctuate up to ~1 lb per entry in either direction

**Blood Pressure** (new):
- Systolic: `generateWanderingSeries(135, 122, totalDaysRange, 4, 5, 4.0, 0)`
- Diastolic: `generateWanderingSeries(88, 78, totalDaysRange, 4, 5, 3.0, 0)`
- Use same day offsets for both (they're measured together)

**Waist** (new, Body Measurements type):
- `generateWanderingSeries(36.0, 33.5, totalDaysRange, 7, 10, 0.5, 1)`

**Chest** (new, same Body Measurements type):
- `generateWanderingSeries(42.0, 40.5, totalDaysRange, 7, 10, 0.4, 1)`

### New log types created

| Log Type | value_type | unit | sort_order |
|---|---|---|---|
| Weight | numeric | lbs | 0 |
| Blood Pressure | dual_numeric | mmHg | 1 |
| Body Measurements | text_numeric | in | 2 |

### Summary of all changes

- Add `generateWanderingSeries` helper function (~20 lines)
- Refactor existing Weight generation to use the helper
- Add Blood Pressure generation block (~40 lines)
- Add Body Measurements generation block with Waist + Chest entries (~50 lines)
- Existing clear logic and `showCustomLogs` settings update remain unchanged

