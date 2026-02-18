
## Add strongly-typed navigation to AI-generated charts

### Approach
Extend the `ChartSpec` schema so the AI explicitly declares two things:
1. **`dataSource`** -- which log the chart is based on: `"food"`, `"exercise"`, `"custom"`, or `"mixed"`
2. **`rawDate`** -- a `yyyy-MM-dd` date string in every data point (already the convention used by all built-in charts)

This removes any need for heuristic date-pattern matching or keyword sniffing on titles.

### Changes

**1. `src/components/trends/DynamicChart.tsx`** -- Update the `ChartSpec` interface:
- Add `dataSource?: "food" | "exercise" | "custom" | "mixed"` (optional so existing saved charts without it still render fine)

**2. `supabase/functions/generate-chart/index.ts`** -- Update the system prompt and output mapping:
- Add `dataSource` to the JSON schema instructions: `"dataSource": "food" or "exercise" or "custom" or "mixed"`
- Require every item in the `data` array to include a `"rawDate": "yyyy-MM-dd"` field
- Map `dataSource` through to the returned `chartSpec`

**3. `src/pages/Trends.tsx`** -- Wire up `onNavigate` on saved charts:
- Simple route map: `food` -> `/`, `exercise` -> `/weights`, `custom` -> `/other`, `mixed`/undefined -> no navigation
- Pass `onNavigate` to `DynamicChart` using `rawDate` from the clicked data point (already how `useChartInteraction` works -- it reads `data.rawDate`)

**4. `src/components/trends/DynamicChart.tsx`** -- Ensure `rawDate` is forwarded:
- When building `chartData`, preserve the `rawDate` field from each data item (it's already spread via `...d`, so this works automatically)
- The `CompactChartTooltip`'s `rawDate` prop currently reads `chartData[index]?.[xAxis.field]` -- update it to read `chartData[index]?.rawDate` instead, matching the built-in chart convention

### What stays the same
- Existing saved charts without `dataSource`/`rawDate` continue to render normally (just without click-to-navigate)
- Built-in charts are untouched
- The `useChartInteraction` hook already calls `onNavigate(data.rawDate)` -- no changes needed there

### Technical detail: system prompt addition
```
"dataSource": "food" or "exercise" or "custom" or "mixed"
```
And in the data array rule:
```
Every object in "data" MUST include a "rawDate" field containing the date in "yyyy-MM-dd" format.
```
