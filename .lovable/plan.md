

## Improve Chart Tooltip Positioning and Size

### Overview
Two improvements to the chart tooltips:
1. Position tooltip so it doesn't cover the chart bars being hovered
2. Reduce font size for a more compact, less intrusive appearance

---

### Solution Approach

Use Recharts' built-in `offset` prop combined with a shared custom tooltip component. This is the standard, non-fragile approach:

- **`offset` prop**: Increases the distance between the cursor and tooltip (default is 5px, we'll use ~20px)
- **Custom tooltip component**: Gives us full control over font size and styling in one reusable place

---

### Changes

**File: `src/pages/Trends.tsx`**

#### 1. Create a compact custom tooltip component (add near top of file, after imports)

```tsx
const CompactTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="rounded-md border border-border bg-card px-2 py-1 shadow-sm">
      <p className="text-[10px] font-medium text-foreground mb-0.5">{label}</p>
      {payload.map((entry: any, index: number) => {
        const displayValue = formatter 
          ? formatter(entry.value, entry.name, entry, index, entry.payload)
          : `${entry.name}: ${Math.round(entry.value)}`;
        return (
          <p 
            key={entry.dataKey || index} 
            className="text-[10px]"
            style={{ color: entry.color }}
          >
            {Array.isArray(displayValue) ? displayValue[0] : displayValue}
          </p>
        );
      })}
    </div>
  );
};
```

#### 2. Update all Tooltip components to use the custom component with offset

**Calories chart (lines 178-184):**
```tsx
<Tooltip
  content={<CompactTooltip />}
  offset={20}
  cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
/>
```

**Macros (%) chart (lines 208-219):**
```tsx
<Tooltip
  content={
    <CompactTooltip
      formatter={(value: number, name: string, props: any) => {
        const rawKey = `${name.toLowerCase()}Raw`;
        const rawValue = props.payload[rawKey];
        return [`${Math.round(value)}% (${Math.round(rawValue)}g)`];
      }}
    />
  }
  offset={20}
  cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
/>
```

**Row 2 charts (lines 248-254):**
```tsx
<Tooltip
  content={<CompactTooltip />}
  offset={20}
  cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
/>
```

---

### Technical Details

| Setting | Purpose |
|---------|---------|
| `offset={20}` | Pushes tooltip 20px away from cursor, reducing overlap with bars |
| `cursor={{ fill: 'hsl(var(--muted)/0.3)' }}` | Subtle highlight on hovered bar, helps user see which bar is active |
| `text-[10px]` | Compact font size (reduced from default ~14-16px) |
| Tailwind classes | Uses existing design tokens (border, card, foreground) for consistency |

---

### Result
- Tooltip appears offset from cursor, not covering the hovered bar
- Font size reduced significantly for less visual intrusion
- Single reusable component for consistency across all charts
- Uses standard Recharts props - no fragile workarounds

