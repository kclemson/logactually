

## Make chart verification robust against non-time-series charts

### Problem

The verification logic blindly treats every data point's `rawDate` as a lookup key into daily totals. This produces false 0% accuracy results for categorical and aggregated charts where `rawDate` is just a provenance marker, not a verification key.

### Root cause

There are three chart classes, but verification only works for one:

| Chart class | Example | rawDate meaning | Verifiable? |
|---|---|---|---|
| Daily time-series | "Daily calories over time" | The actual date this value represents | Yes |
| Categorical / aggregated | "Workout days vs rest days", "by hour", "by day of week" | Arbitrary representative date | No |
| Mixed data source | "Calories on workout vs rest days" | N/A | No (crosses food + exercise) |

### Solution

Add detection heuristics to `verifyChartData` in `src/lib/chart-verification.ts` to identify non-time-series charts and return an informative "unavailable" status instead of a misleading accuracy score.

### Detection heuristics (applied in order)

1. **Mixed data source**: If `spec.dataSource === "mixed"`, return unavailable ("Cross-domain charts can't be verified against single-source totals")

2. **Too few points for the date range**: If `data.length < 5` and the unique rawDates don't span at least `data.length` distinct dates, it's likely categorical. This catches "workout vs rest" (2 points), "by day of week" (7 points with possibly duplicate rawDates), etc.

3. **Duplicate rawDates**: If any rawDate appears more than once in the data array, it's not a 1:1 time-series. Return unavailable.

4. **Non-date x-axis field**: If the xAxis field name doesn't suggest dates (doesn't contain "date" case-insensitive), treat as categorical. This catches `dayType`, `hour`, `weekday`, `exerciseName`, etc.

### Changes to `src/lib/chart-verification.ts`

Add the detection logic at the top of `verifyChartData`, before the existing per-point comparison loop:

```typescript
export function verifyChartData(
  spec: ChartSpec,
  dailyTotals: DailyTotals
): VerificationResult {
  const { data, dataKey } = spec;

  // 1. Mixed data source — can't verify cross-domain
  if (spec.dataSource === "mixed") {
    return { status: "unavailable", reason: "Verification isn't available for charts combining food and exercise data" };
  }

  // 2. No rawDate fields
  const hasRawDate = data.length > 0 && data.some((d) => d.rawDate);
  if (!hasRawDate) {
    return { status: "unavailable", reason: "Verification isn't available for this chart type (no date-based data)" };
  }

  // 3. Duplicate rawDates — indicates aggregated/categorical data
  const rawDates = data.map((d) => d.rawDate as string).filter(Boolean);
  const uniqueDates = new Set(rawDates);
  if (uniqueDates.size < rawDates.length) {
    return { status: "unavailable", reason: "Verification isn't available for aggregated charts (multiple points share the same date)" };
  }

  // 4. Non-date x-axis field — categorical chart
  const xField = spec.xAxis.field.toLowerCase();
  if (!xField.includes("date")) {
    return { status: "unavailable", reason: "Verification isn't available for categorical charts" };
  }

  // ... existing dataKey mapping and per-point comparison logic unchanged ...
}
```

### Why this set of heuristics

- **Mixed source** catches the exact failure shown (workout vs rest days uses both food and exercise data)
- **Duplicate rawDates** is a structural impossibility for valid time-series data
- **Non-date x-axis** catches "by hour", "by day of week", "by exercise name", etc. where the AI uses field names like `dayType`, `hour`, `weekday`
- These are conservative checks: they only decline verification, never produce false positives
- No changes needed to the edge function or prompt — purely client-side defensive logic

### Files changed

| File | Change |
|---|---|
| `src/lib/chart-verification.ts` | Add three guard clauses at top of `verifyChartData` to detect and gracefully handle categorical, aggregated, and mixed-source charts |

### What this does NOT change

- Time-series charts continue to be verified exactly as before
- No edge function changes needed
- No prompt changes needed
- The `rawDate` requirement in the prompt stays (useful for provenance and "go to day" navigation)

