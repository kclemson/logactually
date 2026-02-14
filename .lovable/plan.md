

## Add Frequency Charts for Text-Based Custom Logs

Show bar charts for `text` and `text_multiline` log types that display how many entries exist per date. The tooltip previews the first ~50 characters of the logged text, and tapping a bar navigates to that date on the Custom log page.

### Changes

**1. Include text types in the trends hook (`src/hooks/useCustomLogTrends.ts`)**

Remove the early `continue` that skips `text` and `text_multiline` types (line 46). Instead, handle them as a new case that aggregates entries by date:

- For each date, count the number of entries and collect the text values (truncated to ~50 chars).
- Store these as a single series with `value = count` and a new `textLabel` field containing the preview text (e.g., `"Feeling good today... | Another entry..."`).
- Set `valueType` to `'text'` or `'text_multiline'` so the chart component can identify them.

**2. Render text-type trends as frequency charts (`src/pages/Trends.tsx`)**

In `CustomLogTrendChart`, add an early return for text-based value types (before the existing single/multi-series logic):

- Use `FoodChart` with `dataKey` set to the series label.
- Pass a custom tooltip formatter via a wrapper that shows the count and the text preview from the `textLabel` field stored in `chartData`.
- Since `FoodChart` uses `CompactTooltip`, we'll instead use `StackedMacroChart` (which supports a custom `formatter`) with a single bar, allowing the tooltip to show "2 entries" plus the text preview.

**3. Custom tooltip formatting for text previews**

The `formatter` prop on `StackedMacroChart` will format each entry as:
- Line 1: `"X entries"` (or `"1 entry"`)
- Line 2: The truncated text preview

This requires storing the text preview in the chart data points (already done via `textLabel` in the hook).

### Technical Detail

**File: `src/hooks/useCustomLogTrends.ts`**

Replace line 46 (`if (type.value_type === 'text' || type.value_type === 'text_multiline') continue;`) with a new handler block:

```typescript
if (type.value_type === 'text' || type.value_type === 'text_multiline') {
  const typeEntries = (entries || []).filter((e: any) => e.log_type_id === type.id);
  if (typeEntries.length === 0) continue;

  // Group by date, count entries, collect preview text
  const byDate = new Map<string, { count: number; previews: string[] }>();
  typeEntries.forEach((e: any) => {
    const existing = byDate.get(e.logged_date) || { count: 0, previews: [] };
    existing.count++;
    const text = (e.text_value || '').substring(0, 50);
    if (text) existing.previews.push(text);
    byDate.set(e.logged_date, existing);
  });

  result.push({
    logTypeId: type.id,
    logTypeName: type.name,
    valueType: type.value_type,
    series: [{
      label: type.name,
      data: Array.from(byDate.entries()).map(([date, info]) => ({
        date,
        value: info.count,
        textLabel: info.previews.join(' | '),
      })),
    }],
  });
  continue;
}
```

Move the existing `typeEntries` filter (line 48) below this new block so it only runs for numeric/text_numeric types.

**File: `src/pages/Trends.tsx`**

In `CustomLogTrendChart`, add a check before the existing `trend.series.length === 1` block (around line 458):

```tsx
// Text-only types: frequency chart
if (trend.valueType === 'text' || trend.valueType === 'text_multiline') {
  return (
    <StackedMacroChart
      title={trend.logTypeName}
      subtitle="entries per day"
      chartData={chartData}
      bars={[{
        dataKey: trend.series[0].label,
        name: trend.series[0].label,
        color: TEAL_PALETTE[0],
        isTop: true,
      }]}
      onNavigate={onNavigate}
      formatter={(value, name, entry) => {
        const preview = entry?.payload?.textPreview;
        const count = Math.round(value);
        const lines = [`${count} ${count === 1 ? 'entry' : 'entries'}`];
        if (preview) lines.push(preview.length > 60 ? preview.substring(0, 60) + '...' : preview);
        return lines;
      }}
    />
  );
}
```

Also update the `chartData` builder to include `textPreview` from the trend data. In the `dates.map` callback (line 442-455), when building each point, also pull the `textLabel` from matching data:

```tsx
trend.series.forEach(s => {
  const match = s.data.find(d => d.date === date);
  point[s.label] = match ? match.value : 0;
  if (match?.textLabel) point.textPreview = match.textLabel;
});
```
