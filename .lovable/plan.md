
# Add "Recent examples" to chart tooltips — with date, time, description, and metric

## What's changing from the previous plan

The previous discussion proposed splitting each sample into a multi-line `lines[]` array (one line for description, one for metrics, one for time). The user's correction is clear: each sample is a **single joined string** with the date first:

```
Feb 19 · 8:32 AM · dog walk · 2.4 mi · 47 min
```

This is simpler to build and easier to read. Each sample is pre-formatted as a single string in `chart-data.ts`, and the tooltip just renders it as one `<p>` per sample.

---

## Data available (no new queries needed)

All needed fields are already fetched:

**Exercise** (`weight_sets`): `logged_date`, `created_at`, `description`, `distance_miles`, `duration_minutes`, `sets`, `exercise_metadata` (calories_burned)

**Food** (`food_entries`): `eaten_date`, `created_at`, `food_items[].description`, `food_items[].calories`, `food_items[].protein`

---

## Changes by file

### 1. `src/lib/chart-types.ts`

Add `recentSamples: string[]` to both `foodByItem` and `exerciseByItem` inline types — the simplest possible shape since each sample is already a formatted string:

```typescript
// foodByItem entry gains:
recentSamples: string[];

// exerciseByItem entry gains:
recentSamples: string[];
```

---

### 2. `src/lib/chart-data.ts`

**Exercise side** — inside the `exerciseByItem` block, after updating totals, build and push a formatted sample string. Since rows arrive `ascending` by `logged_date`, we always append and `slice(-3)` to keep only the 3 most recent:

```typescript
// Format: "Feb 19 · 8:32 AM · dog walk · 2.4 mi · 47 min"
const dateLabel = format(new Date(`${row.logged_date}T12:00:00`), "MMM d");
const timeLabel = row.created_at
  ? format(new Date(row.created_at), "h:mm a")
  : null;
const metricParts: string[] = [];
if (row.distance_miles) metricParts.push(`${row.distance_miles.toFixed(1)} mi`);
if (row.duration_minutes) metricParts.push(`${row.duration_minutes} min`);
const parts = [dateLabel, timeLabel, label, ...metricParts].filter(Boolean);
const sampleStr = parts.join(" · ");
existing.recentSamples = [...(existing.recentSamples ?? []), sampleStr].slice(-3);
```

**Food side** — inside the `foodByItem` item loop, same pattern but using `item.description` and calories. Note that food items within a single food_entry log share the same `created_at` timestamp:

```typescript
const dateLabel = format(new Date(`${row.eaten_date}T12:00:00`), "MMM d");
const timeLabel = row.created_at
  ? format(new Date(row.created_at), "h:mm a")
  : null;
const calStr = `${Math.round(item.calories || 0)} cal`;
const parts = [dateLabel, timeLabel, item.description, calStr].filter(Boolean);
const sampleStr = parts.join(" · ");
existing.recentSamples = [...(existing.recentSamples ?? []), sampleStr].slice(-3);
```

---

### 3. `src/lib/chart-dsl.ts`

In `case "item":` for both food and exercise data points, add `_samples`:

```typescript
dataPoints.push({
  label: ...,
  value: ...,
  _details: [...],
  _samples: item.recentSamples ?? [],
});
```

No formatting work here — strings are already ready from `chart-data.ts`.

---

### 4. `src/components/trends/CompactChartTooltip.tsx`

After the `_details` block, render samples with a divider and "Recent" header:

```tsx
{payload[0]?.payload?._samples?.length > 0 && (
  <div className="mt-1 pt-1 border-t border-border/40">
    <p className="text-[9px] text-muted-foreground font-medium mb-0.5">Recent</p>
    {(payload[0].payload._samples as string[]).map((sample, i) => (
      <p key={i} className="text-[9px] text-muted-foreground leading-snug">
        {sample}
      </p>
    ))}
  </div>
)}
```

---

## Final tooltip appearance

```
Walking
56 mi
56 entries · 1,258 min · 3,644 cal

──────────────
Recent
Feb 19 · 8:32 AM · dog walk · 2.4 mi · 47 min
Feb 17 · 7:15 AM · dog walk · 1.8 mi · 38 min
Feb 14 · 9:04 AM · dog walk · 3.2 mi · 31 min
```

And for a food item chart:
```
Yogurt and Strawberries
605 cal
3 entries · 75g protein

──────────────
Recent
Feb 19 · 6:45 AM · yogurt and strawberries · 320 cal
Feb 17 · 7:02 AM · yogurt and strawberries · 285 cal
```

---

## Files changed

| File | Change |
|---|---|
| `src/lib/chart-types.ts` | Add `recentSamples: string[]` to both `foodByItem` and `exerciseByItem` type definitions |
| `src/lib/chart-data.ts` | Build formatted sample strings and push to `recentSamples` (keeping last 3) during item-level aggregation for both exercise and food |
| `src/lib/chart-dsl.ts` | Attach `_samples: item.recentSamples ?? []` to data points in `case "item":` for both food and exercise |
| `src/components/trends/CompactChartTooltip.tsx` | Render `_samples` as a "Recent" section below the `_details` line, with a divider |

## Scope notes

- Only `groupBy: "item"` charts — both food and exercise
- Only v2 DSL charts (v1 charts don't carry `_samples`, tooltip degrades gracefully with nothing shown)
- No new queries, no schema changes, no edge function changes
- Max 3 samples, most recent first (enforced by `slice(-3)` on ascending-ordered data)
