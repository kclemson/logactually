
## Fix line chart labels — use viewBox instead of cx/cy

### Root cause

Recharts' `LabelList` with a custom `content` renderer receives a `viewBox` object (`{ x, y, width, height }`) — it does **not** pass `cx`/`cy` directly. The current `lineLabelRenderer` destructures `cx` and `cy`, which are always `undefined`, so the guard `typeof cx !== "number"` is always `true` and every label returns `null`.

The bar chart renderer works correctly because it uses `x`, `y`, and `width` — which are exactly the `viewBox` fields that `LabelList` does provide.

### Fix

Update `lineLabelRenderer` in `DynamicChart.tsx` to read from `viewBox` instead:

```tsx
const lineLabelRenderer = (props: any) => {
  const { viewBox, value, index } = props;
  if (!chartData[index]?._showLabel) return null;
  if (value == null || value === 0) return null;
  const { x, y, width } = viewBox ?? {};
  if (typeof x !== "number" || typeof y !== "number") return null;
  return (
    <text
      x={x + (width ?? 0) / 2}
      y={y - 4}
      fill={color}
      textAnchor="middle"
      fontSize={7}
      fontWeight={500}
    >
      {formatValue(Number(value), valueFormat)}
    </text>
  );
};
```

The `viewBox` bounding box is centered on the dot, so `x + width/2` is the dot's center X and `y - 4` places the label just above the dot's top edge — consistent with the bar label offset of `y - 4`.

### What stays the same

- `_showLabel` thinning interval — unchanged
- `formatValue` formatting — unchanged
- Bar chart labels — untouched
- No other files change

### File changed

Only `src/components/trends/DynamicChart.tsx` — 4-line change inside `lineLabelRenderer`.
