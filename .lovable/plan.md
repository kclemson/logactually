

## Blood Pressure Chart: Stacked Bars with "120/80" Labels (No In-Bar Text)

### What changes for the user

The Blood Pressure chart switches from two side-by-side bars (with "High" and "Low" labels rotated inside) to a **single stacked column** per day. A "120/80"-style label appears above the column. The tooltip still shows "Systolic: 120" and "Diastolic: 80" for clarity.

Also: remove `dual_numeric` from the "Create your own" log type dialog, since Blood Pressure is now a built-in template.

### Visual

```text
     120/80    118/76
     +----+    +----+
     |    |    |    |    <-- darker teal (systolic)
     +----+    +----+
     |    |    |    |    <-- lighter teal (diastolic)
     +----+    +----+
     Jan 5     Jan 6
```

No text labels inside the bars. Just a "sys/dia" label above each column at the same intervals as other charts.

### Technical Details

#### 1. `src/components/trends/CustomLogTrendChart.tsx`

**chartData construction (inside `useMemo`):**
- For `dual_numeric` trends, add a `bpLabel` field to each data point: combine the High and Low values into a string like `"120/80"`. Only populate it on points where `showLabelFullWidth` is true, to avoid clutter.

**dual_numeric rendering (lines 96-114):**
- Remove `grouped` prop (makes bars stack instead of side-by-side)
- Rename series labels from "High"/"Low" to "Systolic"/"Diastolic" (or keep as-is and just adjust tooltip)
- Add `labelDataKey="bpLabel"` and `labelColor={TEAL_PALETTE[0]}` to show the formatted label above the top bar
- Update `formatter` to show "Systolic: 120" / "Diastolic: 80" in the tooltip

#### 2. `src/components/CreateLogTypeDialog.tsx`

- Remove the `dual_numeric` option from `VALUE_TYPE_OPTIONS` (reduce from 3 options to 2: Numeric and Text only)
- No backend changes needed; `dual_numeric` remains supported in the data layer for existing log types

#### 3. `src/hooks/useCustomLogTrends.ts`

- Rename the series labels for `dual_numeric` from "High"/"Low" to "Systolic"/"Diastolic" so the tooltip reads naturally

### Files to modify

- `src/components/trends/CustomLogTrendChart.tsx` -- stacked bars + bpLabel
- `src/components/CreateLogTypeDialog.tsx` -- remove dual_numeric option
- `src/hooks/useCustomLogTrends.ts` -- rename High/Low to Systolic/Diastolic

