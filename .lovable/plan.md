## Threshold custom-log charts on Trends page

Mirror the exercise `qualifiedExercises` pattern for the "Custom Trends" section: filter out custom-log charts that don't have enough data to be a meaningful trend, using page-level derivation so shared consumers (`OtherLog` inline all-time, `CustomLogGroupTrend`) remain unaffected.

### Rule
Hide a custom-log chart when **fewer than 2 distinct dates** appear across all its series. One datapoint isn't a trend; two is the minimum to draw a line/comparison.

Applies uniformly to `numeric`, `dual_numeric`, `text_numeric`, `text`, and `text_multiline` types — the `unique_dates >= 2` predicate is well-defined for every case (`dual_numeric` shares one date per entry; `text_numeric`/`text` aggregate by date already).

Bloodwork panel charts are unaffected — they're pinned by the user explicitly, same as pinned exercise charts.

### Current data preview (all-time)
Would **show**: Weight (52), Body Fat % (10), Blood Pressure (5). Would **hide**: 5 single-datapoint measurements (Thigh, Neck, Waist, Hips, Bicep).

### Implementation
`src/pages/Trends.tsx`:
1. Add `qualifiedCustomLogTrends = useMemo(...)` right after the existing `qualifiedExercises` block. Predicate: `new Set(trend.series.flatMap(s => s.data.map(d => d.date))).size >= 2`.
2. Replace the three references to `customLogTrends` in render/visibility logic (lines 407, 801, 818) with `qualifiedCustomLogTrends`. The raw hook data isn't needed anywhere else on this page.

No hook changes, no changes to `OtherLog.tsx`, `CustomLogGroupTrend.tsx`, or `CustomLogTrendChart.tsx`.

### Not in scope
- Relative-floor logic (top-N% by count). Custom logs are user-declared trackers, not auto-detected — the "min-2 dates" floor is enough; a relative cap would suppress deliberately-tracked slow-cadence metrics (quarterly measurements, etc.).
- Any threshold change to inline single-type views or the group-trend embed.
