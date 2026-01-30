

## Add Total Calories to Combined Chart Tooltip

The current tooltip shows the macro breakdown (Protein, Carbs, Fat in calories) but doesn't show the total. We'll add the total calories to the tooltip header.

### Change

**File: `src/pages/Trends.tsx`** (line 577-579)

Update the Tooltip for the combined chart to use a custom formatter that also displays total calories. Since the `CompactTooltip` already shows the date as the label, we can add total calories right after the date header.

The approach: Create a custom tooltip component specifically for this chart, or pass additional info via the formatter. The cleanest solution is to add the total calories display in the tooltip by accessing `entry.payload.calories` from the first payload item.

```tsx
<Tooltip
  content={
    <CompactTooltip 
      formatter={(value, name, entry) => `${name}: ${Math.round(value)} cal`}
      // Access entry.payload.calories for total
    />
  }
  offset={20}
  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
/>
```

However, since `CompactTooltip` doesn't have a built-in way to show totals, the cleanest fix is to:

1. **Add a `showTotal` prop** to `CompactTooltip` that, when true, displays the total calories from `payload[0].payload.calories` in the header area
2. Or create a dedicated tooltip component for this chart

**Recommended approach**: Extend `CompactTooltip` to accept an optional `totalKey` prop that displays a total value from the payload data in the header.

### Updated CompactTooltip (lines 63-84)

```tsx
const CompactTooltip = ({ active, payload, label, formatter, totalKey, totalLabel, totalColor }: any) => {
  if (!active || !payload?.length) return null;

  // Get total from the first payload item's data if totalKey is provided
  const totalValue = totalKey && payload[0]?.payload?.[totalKey];

  return (
    <div className="rounded-md border border-border/50 bg-white dark:bg-slate-800 px-2 py-1 shadow-md">
      <p className="text-[10px] font-medium text-slate-900 dark:text-slate-100 mb-0.5">{label}</p>
      {totalValue !== undefined && (
        <p className="text-[10px] font-semibold mb-0.5" style={{ color: totalColor || '#0033CC' }}>
          {totalLabel || 'Total'}: {Math.round(totalValue)} cal
        </p>
      )}
      {payload
        .slice()
        .reverse()
        .map((entry: any, index: number) => {
          const displayValue = formatter
            ? formatter(entry.value, entry.name, entry, index, entry.payload)
            : `${entry.name}: ${Math.round(entry.value)}`;
          return (
            <p key={entry.dataKey || index} className="text-[10px]" style={{ color: entry.color }}>
              {Array.isArray(displayValue) ? displayValue[0] : displayValue}
            </p>
          );
        })}
    </div>
  );
};
```

### Updated Combined Chart Tooltip (line 577-581)

```tsx
<Tooltip
  content={
    <CompactTooltip 
      formatter={(value, name) => `${name}: ${Math.round(value)} cal`}
      totalKey="calories"
      totalLabel="Calories"
      totalColor={CHART_COLORS.calories}
    />
  }
  offset={20}
  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
/>
```

### Result

The tooltip will now show:
```
Jan 24
Calories: 1824 cal  ← NEW (in blue)
Protein: 232 cal
Carbs: 908 cal
Fat: 684 cal
```

