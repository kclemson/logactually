
# Two fixes: "categorical" bug + v1/v2 annotation in debug output

## Fix 1: The "categorical" false positive for date-based v2 charts

### Root cause

In `verifyDeterministic` (line 324–328 of `chart-verification.ts`):

```ts
const xField = spec.xAxis.field.toLowerCase();
if (!xField.includes("date")) {
  return { status: "unavailable", reason: "Verification isn't available for categorical charts" };
}
```

This guard checks whether the compiled `ChartSpec`'s `xAxis.field` contains the substring `"date"`. For v2 charts the DSL engine populates `xAxis.field` with `"label"` (the generic label property used for bar/line x-axis rendering), not `"date"` — even when `groupBy: "date"` was specified. So daily fiber intake, daily sodium, etc. all fail this check and get labeled "categorical" when they are not.

The real intent of this guard is: **skip verification for charts grouped by non-date dimensions** (day-of-week, food item name, exercise type, hour-of-day, etc.). A cleaner signal than the field name is whether any data point has a `rawDate` property — which the v2 engine only attaches when `groupBy` is `"date"` or `"week"`. We already have that check two lines above (the `hasRawDate` guard). So the `xField.includes("date")` guard is **redundant and wrong** — if we passed the `hasRawDate` guard, we already know it's date-based.

### Fix

Remove the `xField.includes("date")` guard entirely. The `hasRawDate` guard immediately above it already covers this case correctly:

```ts
// REMOVE this block — hasRawDate above already handles it
const xField = spec.xAxis.field.toLowerCase();
if (!xField.includes("date")) {
  return { status: "unavailable", reason: "Verification isn't available for categorical charts" };
}
```

Also update the "no rawDate" message to make it clearer:

```ts
if (!hasRawDate) {
  return { status: "unavailable", reason: "Verification isn't available for categorical charts (e.g. grouped by item, day-of-week, or hour)" };
}
```

This is a one-block deletion in `chart-verification.ts`. All genuinely categorical charts (item, dayOfWeek, hourOfDay, category) will still correctly return "unavailable" because they don't attach `rawDate` to their data points.

---

## Fix 2: v1/v2 annotation in debug JSON output

### What to add

In `CustomChartDialog.tsx`, the debug textarea renders:

```tsx
value={JSON.stringify(resultMode === "v2" ? chartDSL : currentSpec, null, 2)}
```

Wrap the object in a thin annotated envelope before serialising:

```ts
const debugPayload = resultMode === "v2"
  ? { _generator: "v2 · AI schema (DSL)", ...chartDSL as object }
  : { _generator: "v1 · AI data (direct chart spec)", ...currentSpec as object };

value={JSON.stringify(debugPayload, null, 2)}
```

The `_generator` key will appear at the top of the JSON output, giving instant visual confirmation of which path was used.

---

## Files changed

| File | Change |
|---|---|
| `src/lib/chart-verification.ts` | Remove the redundant `xField.includes("date")` guard (3 lines deleted); improve the `hasRawDate` message to be accurate about what "categorical" means |
| `src/components/CustomChartDialog.tsx` | Wrap debug JSON in a thin annotated object with a `_generator` field before serialising |
