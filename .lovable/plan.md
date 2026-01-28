

## Stack Labels Vertically with Centered Rows

Replace the rotated text with vertically stacked `<tspan>` elements. Each row will be horizontally centered by setting `x={centerX}` on every `<tspan>`.

---

### Changes to `src/pages/Trends.tsx`

Update `renderGroupedLabel` (lines 57-79):

```typescript
const renderGroupedLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  
  if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
  
  const centerX = x + width / 2;
  
  // Parse the label "3×10×160" into parts
  const parts = value.split('×');
  if (parts.length !== 3) return null;
  
  const [sets, reps, weight] = parts;
  
  // Build the stacked format: ["3", "×", "10", "×", "160"]
  const lines = [sets, '×', reps, '×', weight];
  const lineHeight = 8; // pixels between lines
  
  // Calculate starting Y to center the 5 lines vertically in the bar
  const totalTextHeight = lines.length * lineHeight;
  const startY = y + ((height || 0) - totalTextHeight) / 2 + lineHeight / 2;
  
  return (
    <text
      x={centerX}
      fill="#FFFFFF"
      textAnchor="middle"
      fontSize={7}
      fontWeight={500}
    >
      {lines.map((line, i) => (
        <tspan
          key={i}
          x={centerX}
          y={startY + i * lineHeight}
        >
          {line}
        </tspan>
      ))}
    </text>
  );
};
```

---

### How Horizontal Centering Works

| Attribute | Purpose |
|-----------|---------|
| `textAnchor="middle"` on `<text>` | Sets default centering behavior |
| `x={centerX}` on each `<tspan>` | Centers each row at the bar's horizontal center |

Each `<tspan>` gets its own `x` coordinate, so even though they have different text widths (like "3" vs "160"), they all anchor to the same center point.

---

### Visual Result

```
┌──────┐
│  3   │  ← centered
│  ×   │  ← centered  
│  10  │  ← centered
│  ×   │  ← centered
│ 160  │  ← centered (wider, but still centered)
└──────┘
```

---

### File to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/pages/Trends.tsx` | 57-79 | Replace rotated text with stacked `<tspan>` elements |

