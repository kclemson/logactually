

## Fix: treat zero as "no data" in dual-series intersection filter

### Problem

The `chart-merge.ts` filter currently checks `d.value != null && d.value2 != null`, but exercise metrics like "weight (lbs)" return `0` on rest days rather than `null`. So the filter keeps those rows.

### Change

**`src/lib/chart-merge.ts`** — Update the intersection filter on line 75 to also exclude zero values:

```ts
.filter(d => d.value != null && d.value !== 0 && d.value2 != null && d.value2 !== 0);
```

This ensures days where either metric is zero (meaning no activity was logged) are excluded from the comparison view. Single-series charts are unaffected since they don't go through `mergeChartSpecs`.

One line change, no other files affected.

