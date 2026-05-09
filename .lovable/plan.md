# Replace `2026-W10` weekly chart labels with a real date

## Goal

Stop showing ISO-week strings like `2026-W10` on the X-axis of weekly-grouped charts. Show a real date instead. Keep one code path — no rolling-average special-case, no setting plumbing, no bucket-boundary changes.

## The change

Single line in `src/lib/chart-dsl.ts` (~line 417), inside the `groupBy: "week"` branch:

```ts
// before
label: weekKey,                           // e.g. "2026-W10"

// after
label: format(new Date(`${weekDates[weekKey]}T12:00:00`), "MMM d"),  // e.g. "Mar 9"
```

`weekDates[weekKey]` is already computed and tracks the latest logged date in each bucket. `MMM d` matches the format daily charts use (line 285), so weekly charts now visually belong to the same family.

Nothing else moves:
- ISO-week bucketing (Mon–Sun) is unchanged.
- `weekKey` stays as the internal bucket key.
- `rawDate` stays as the latest logged date (chart-merge keys on it — unchanged).
- No `executeDSL` signature change, no callsite updates, no test updates.

## Known downsides (accepted)

| Downside | Why it's OK |
|---|---|
| Bucket boundaries stay ISO regardless of `weekStartDay` | Pre-existing; this change doesn't worsen it |
| Label position varies with logging density (full week → Sunday; sparse week → last logged day) | Accurate to data; tick interval is index-based not date-based, so axis spacing is unaffected |
| Current partial-week label shifts day-by-day as new logs land | Accurate, not misleading |
| Two adjacent buckets can show near-touching dates at the chart's right edge | Resolves once the current week fills out; context makes intent obvious |
| Compare tooltip may show one series' last-logged date for a shared bucket | Cosmetic; rawDate-keyed merging is unchanged |

## Verification

- Visual: load the rolling 7-day protein chart at 90d range — labels read `Mar 9`, `Mar 16`, etc. instead of `2026-W10`.
- Single-series weekly chart: full historical weeks land on their last day (typically Sunday for daily-loggers); current partial week lands on today.
- Compare chart with weekly groupBy: still merges into one chart (rawDate-keyed merging unchanged).

## Out of scope

- Bucket boundary alignment with `weekStartDay` setting.
- Daily, weekday-of-week, hour-of-day branches.
- `chart-label-interval.ts`, `chart-merge.ts`.
- Saved-chart DSL JSON shape.
