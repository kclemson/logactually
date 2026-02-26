

## Tooltip richness audit — current state vs proposed, with examples

| groupBy | Source | Example Prompt | Current Tooltip | Proposed Tooltip | What Changes (code) |
|---------|--------|----------------|-----------------|------------------|---------------------|
| **date** | food | "daily calories last 30 days" | `calories: 2,145` | **`2,145 cal`**<br>`48g protein · 220g carbs · 85g fat`<br>`12 entries` | Attach `_details` with secondary macros + entry count from `dailyTotals.food[date]` |
| **date** | exercise | "daily distance last 60 days" | `distance: 3.2` | **`3.2 mi`**<br>`4 sets · 42 min · est. 380 cal burned` | Attach `_details` with secondary exercise metrics from `dailyTotals.exercise[date]` |
| **date** + compare | food | "calories minus protein×4" | `net: 1,200`<br>`calories: 2,100 · protein×4: 900` | *(no change — compare breakdown already good)* | None |
| **date** + window | food | "7-day rolling avg calories" | `calories: 1,980` | **`1,980 cal`** *(7-day avg)*<br>Raw values lost after smoothing — keep as-is | None (raw daily data not retained after window) |
| **week** | food | "weekly protein totals" | `protein: 412`<br>`5 days` | **`412g protein`**<br>`5 days · avg 82g/day` | Add per-day average to `_details` |
| **week** | exercise | "weekly distance" | `distance: 18`<br>`6 days` | **`18.0 mi`**<br>`6 days · avg 3.0 mi/day` | Add per-day average to `_details` |
| **dayOfWeek** | food | "avg calories by day of week" | `calories: 2,050`<br>`8 days` | **`2,050 cal`** *(avg)*<br>`8 days · 1,820–2,340 range` | Compute min/max from bucket values, add to `_details` |
| **dayOfWeek** | exercise | "avg duration by day of week" | `duration: 45`<br>`6 days` | **`45 min`** *(avg)*<br>`6 days · 20–72 min range` | Compute min/max from bucket values |
| **weekdayVsWeekend** | food | "weekday vs weekend calories" | `calories: 1,950`<br>`20 days` | **`1,950 cal`** *(avg)*<br>`20 days · 1,600–2,400 range` | Same as dayOfWeek — add min/max |
| **hourOfDay** | food | "what time do I eat most calories" | `calories: 680`<br>`45 entries` | **`680 cal`** *(avg)*<br>`45 entries · 120–1,200 range` | Compute min/max from per-entry values |
| **hourOfDay** | exercise | "what time do I usually exercise" | `sets: 12`<br>`8 entries` | **`12 sets`** *(avg)*<br>`8 entries · 2–24 range` | Same pattern |
| **item** | food | "top foods by calories" | `1,240 cal`<br>`18 entries · 94g protein`<br>─ Recent ─<br>`Feb 24 8pm Chicken… 450 cal` | **`1,240 cal total`**<br>`18 entries · avg 69 cal each`<br>`94g protein`<br>─ Recent ─<br>`Feb 24 8pm Chicken… 450 cal` | Add per-entry average to header context |
| **item** | exercise | "distance by exercise type" | `98.0 mi`<br>`175 entries · 42 sets · 1,820 min`<br>─ Recent ─<br>`Feb 23 7am Morning run 3.1mi` | **`98.0 mi total`**<br>`175 entries · 0.2–3.1 mi each`<br>`42 sets · 1,820 min · est. 12,260 cal`<br>─ Recent ─<br>`Feb 23 7am Morning run 3.1mi` | Add min/max per-entry range from `valuesPerEntry`; restructure `_details` order |
| **category** | exercise | "cardio vs strength total sets" | `1,240 sets`<br>`320 min · 45 mi · 8,200 cal · 180 entries` | **`1,240 sets`**<br>`180 entries · 320 min · 45 mi`<br>`est. 8,200 cal burned` | Reorder `_details` for readability (entries first, cal burned last) |
| **dayClassification** | exercise | "days with strength training" | `49` *(bare count, no details)* | **`49 days`**<br>`out of 72 total days (68%)` | Attach total day count and percentage to `_details` |
| **dayClassification** (threshold) | food | "days over 2000 calories" | `35` *(bare count)* | **`35 days`**<br>`out of 60 total days (58%)`<br>`avg 2,340 cal on matching days` | Track matching-day values to compute average |

### Key design principles for the proposed tooltips

1. **Lead with the value + unit** — not `distance: 3.2` but `3.2 mi`. The column label already tells you the metric; the tooltip should add context, not repeat the axis.

2. **Show the "shape" of the data** — ranges (min–max) and averages reveal whether a total comes from many small entries or a few large ones.

3. **Hierarchical information density** — primary value bold at top, secondary context in muted 9px below, samples last behind a divider. Each layer is optional.

4. **No raw field names** — `duration_minutes` → `min`, `distance_miles` → `mi`, `calories_burned` → `cal burned`.

### Implementation approach

All changes happen in two files:

**`src/lib/chart-dsl.ts`** — Enrich `_details` during `executeDSL`:
- `date`: attach secondary metrics from the daily totals object for that date
- `dayOfWeek` / `weekdayVsWeekend`: track min/max while bucketing, add range string
- `hourOfDay`: track min/max from per-entry values
- `week`: add computed per-day average
- `item`: add per-entry min/max range from existing `valuesPerEntry`
- `category`: reorder details (entries first)
- `dayClassification`: pass total day count alongside true/false counts

**`src/components/trends/CompactChartTooltip.tsx`** — No structural changes needed. The existing `_details` renderer already handles the `{ label, value }[]` format. The enrichment happens entirely in the data layer.

**Optional (polish):** A small helper in `chart-dsl.ts` to humanize metric labels (`duration_minutes` → `min`) so `_details` labels read naturally.

