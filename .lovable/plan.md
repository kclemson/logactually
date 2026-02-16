

# Remove unnecessary ".0" from chart bar labels

## What changes

When a duration or distance value is a whole number (like 17 minutes), the bar label currently shows "17.0". It should show just "17". Same applies to mph and distance labels.

## Technical Details

### File: `src/components/trends/ExerciseChart.tsx`

Four places where `.toFixed()` produces unnecessary trailing zeros:

1. **Line 94** (mph calculation): `.toFixed(1)` -- wrap with `parseFloat()` to strip trailing zero
2. **Line 97** (pace calculation): `.toFixed(1)` -- same fix
3. **Line 105** (distance label): `.toFixed(2)` -- same fix
4. **Line 108** (duration label for non-walking cardio): `.toFixed(1)` -- same fix

The fix pattern is the same everywhere: wrap `Number(x.toFixed(n))` or `parseFloat(x.toFixed(n))` so that `17.0` becomes `17` and `11.3` stays `11.3`.

Concretely:
- Line 94: `Number((d.distance_miles / (d.duration_minutes / 60)).toFixed(1))` -- already uses `Number()` wrapper, so this one is fine (Number strips trailing zeros). But let me verify... actually `Number("17.0")` returns `17`, so lines 94 and 97 are already correct for the data values. The issue is line 108 which produces a string directly.
- **Line 108**: Change from `` `${Number(d.duration_minutes || 0).toFixed(1)}` `` to `` `${parseFloat(Number(d.duration_minutes || 0).toFixed(1))}` ``
- **Line 105**: Change from `` `${Number(d.distance_miles || 0).toFixed(2)}` `` to `` `${parseFloat(Number(d.distance_miles || 0).toFixed(2))}` ``

Only lines 105 and 108 produce label strings with trailing zeros. Lines 94/97 already use `Number()` wrapper so their numeric values are clean.

### Files modified

| File | Change |
|---|---|
| `src/components/trends/ExerciseChart.tsx` | Strip trailing ".0" from duration and distance bar labels (lines 105, 108) |

