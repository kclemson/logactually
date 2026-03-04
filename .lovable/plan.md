

## Fix: Heart rate double-counting in chart aggregation

### Root cause

In `chart-data.ts` line 233:
```ts
const rowHeartRate = row.heart_rate ?? meta?.heart_rate ?? null;
```

When `row.heart_rate` is NULL (column not populated), it falls back to `meta?.heart_rate` from the JSONB. JSONB values can be strings (e.g., `"114"`). When a string heart rate is added to a numeric sum (`114 + "114"` → `"114114"`), JavaScript string concatenation corrupts the entire day's total. The post-processing division then produces astronomically wrong averages.

There's at least 1 walking entry in the current data where the column is NULL but the JSONB has the value.

### Fix

**`src/lib/chart-data.ts`** — Coerce `rowHeartRate` to a number:

```ts
const rowHeartRate = Number(row.heart_rate ?? meta?.heart_rate ?? null) || null;
```

This ensures the JSONB fallback value is always numeric. `Number(null)` → 0, caught by `|| null`. `Number("114")` → 114. This is the same defensive pattern we just applied to food macros.

Also apply the same `Number()` coercion to all other JSONB fallback reads in this function (`rowCaloriesBurned` at line 232) as defense-in-depth.

### Scope

One file, two lines changed.

