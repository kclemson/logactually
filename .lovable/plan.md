

## Filter dual-series charts to intersection dates only

### Change

**`src/lib/chart-merge.ts`** — After building the merged data array, filter out any entry where either `value` or `value2` is `null`. This ensures only dates with data from both series are shown.

```ts
// Current: allKeys includes union of both date sets
// Add: filter merged data to intersection
const mergedData = allKeys.map(...)
  .filter(d => d.value != null && d.value2 != null);
```

One-line change in `mergeChartSpecs`. The `connectNulls` and null-dot-skipping logic from the previous fix remains as a safety net but won't be needed for merged charts since there won't be null entries.

No other files change — the filtering happens before anything downstream sees the data.

