
# Fix: Tooltip max-width + Recent samples sort order

## Issue 1: Tooltip width overflow

### Root cause

`CompactChartTooltip`'s container uses `w-max` (line 33), making it expand to its natural content width. The `_details` block renders all secondary metrics (entries, duration_minutes, calories_burned, heart_rate) as a single `<p>` with ` · ` separators inline. On a chart with 4 non-zero detail fields this can reach 300px+, spilling over the adjacent chart.

### Fix

Two changes:

**1. Add `max-w-[220px]` to the tooltip container** and let it wrap naturally:

```tsx
<div className="rounded-md border border-border bg-popover text-popover-foreground px-2 py-1 shadow-md w-max max-w-[220px]">
```

`w-max` still prevents needless width on small tooltips; `max-w-[220px]` caps it before it can overlap the next chart.

**2. Change the `_details` rendering from a single inline `<p>` to one line per detail item**, so each secondary metric wraps cleanly rather than all on one run-on line:

Currently:
```tsx
<p className="text-[9px] text-muted-foreground mt-0.5">
  {payload[0].payload._details.map((d, i) => (
    <span key={d.label}>{i > 0 && " · "}{d.value} {d.label}</span>
  ))}
</p>
```

Change to:
```tsx
<div className="text-[9px] text-muted-foreground mt-0.5 space-y-0">
  {payload[0].payload._details.map((d, i) => (
    <span key={d.label}>{i > 0 && " · "}{d.value} {d.label}</span>
  ))}
</div>
```

Wait — keeping `span` with ` · ` separators but inside a wrapping container with `max-w` will cause natural wrapping at the boundary. That's actually fine and readable. No structural change needed to the `_details` render — the `max-w` alone will cause natural line wrapping on the separators.

---

## Issue 2: Recent samples sort order

### Root cause

In `fetchExerciseData` (and `fetchFoodData`), the DB query orders by `logged_date` ascending but has **no secondary sort on `created_at`**. Within a single day (e.g., Feb 20), multiple rows come back in arbitrary order. The `recentSamples` array is accumulated in that arbitrary order, so samples from the same day can appear as `8:50 AM → 9:36 AM → 8:40 AM` — because the DB returned the 8:40 row third.

### Fix

Add `.order("created_at", { ascending: true })` as a secondary sort to the exercise query (and the food query). This ensures that within each day, rows are processed in chronological order, so `recentSamples` accumulates samples in the correct time sequence:

**Exercise query** (line 159 in `chart-data.ts`):
```ts
.order("logged_date", { ascending: true })
.order("created_at", { ascending: true });
```

**Food query** — check the food fetcher's query for the same fix. The food `recentSamples` time ordering has the same potential issue.

Since the DB query now returns rows in `logged_date, created_at` order, `recentSamples = [...existing, newSample].slice(-3)` will correctly keep the 3 most recent entries in chronological order.

---

## Files changed

| File | Change |
|------|--------|
| `src/components/trends/CompactChartTooltip.tsx` | Add `max-w-[220px]` to the tooltip container div |
| `src/lib/chart-data.ts` | Add `.order("created_at", { ascending: true })` as secondary sort to both the exercise and food DB queries |
