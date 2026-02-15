

# Calorie Burn Chart: Midpoint Bars + Range Context

## The Problem

Most users have no biometric data configured, producing wide calorie ranges (e.g., 41-155 cal) that render as confusing floating bars. Even configured users see floating bands that lack a clear trend line.

## Approach

Switch the chart from floating range bars to **solid midpoint bars** (like the other charts), and show the range as context in tooltips. Add a subtitle nudge for users without biometrics.

### Visual Change

- **Bar**: Solid bar from 0 to midpoint `(low + high) / 2`, like any normal bar chart
- **Tooltip**: Shows "~148 cal" for narrow ranges (low === high or configured user), or "~98 cal (range: 41-155)" for wide ranges
- **Subtitle**: 
  - If user has biometrics configured: "Daily range" (current)
  - If not: "Configure in Settings for precision"

### How to Detect "Has Biometrics"

A user is considered configured if `bodyWeightLbs` is set (the single highest-impact field, ~30-50% of the range). This is already available via `useUserSettings()` in `Trends.tsx`.

## Technical Details

### File: `src/pages/Trends.tsx`

1. Pass a `hasBiometrics` boolean (derived from `settings.bodyWeightLbs != null`) into the chart subtitle:
   ```
   subtitle={settings.bodyWeightLbs ? "Daily estimate" : "Configure in Settings for precision"}
   ```

2. Change `calorieBurnChartData` to compute a `midpoint` field instead of `base`/`band`:
   ```ts
   midpoint: Math.round((d.low + d.high) / 2),
   ```

### File: `src/components/trends/CalorieBurnChart.tsx`

1. Update the interface to use `midpoint` instead of `base`/`band`
2. Replace the two stacked bars (transparent base + colored band) with a single bar on `midpoint`
3. Remove the `yMin` / `adjustedData` logic (no longer needed -- bars start from 0)
4. Update tooltip to show midpoint with optional range: 
   - Narrow range (high/low ratio less than 1.5): "~148 cal"
   - Wide range: "~98 cal (range: 41-155)"

### What gets simpler

- No more transparent stacked bar hack
- No more `yMin` floor calculation
- No more `adjustedData` memo
- Standard bar chart, consistent with every other chart on the page
