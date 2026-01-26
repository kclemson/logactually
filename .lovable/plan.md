

## Fix Tooltip Issues on Trends Charts

### Problem Analysis
The recent tooltip changes are causing three issues:
1. **Blank squares below charts** - `wrapperStyle={{ visibility: 'visible' }}` forces the tooltip to always render even when not hovering
2. **Macros tooltip z-order/background issues** - Fixed positioning conflicts with the chart's layering
3. **Persistent date labels** - The tooltip doesn't clean up properly due to forced visibility

### Solution
Revert the problematic tooltip props and use Recharts' default tooltip behavior. The default tooltip follows the cursor naturally and only appears on hover - this is more reliable than trying to force a fixed position below the chart.

---

### Changes

**File: `src/pages/Trends.tsx`**

#### Remove the problematic props from all Tooltip components

| Location | Lines | Action |
|----------|-------|--------|
| Calories chart | 178-186 | Remove `position` and `wrapperStyle` props |
| Macros (%) chart | 210-223 | Remove `position` and `wrapperStyle` props |
| Row 2 charts (Protein/Carbs/Fat) | 252-260 | Remove `position` and `wrapperStyle` props |

#### Updated Tooltip for Calories (example):
```tsx
<Tooltip
  contentStyle={{
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
  }}
/>
```

#### Updated Tooltip for Macros (%):
```tsx
<Tooltip
  contentStyle={{
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
  }}
  formatter={(value: number, name: string, props: any) => {
    const rawKey = `${name.toLowerCase()}Raw`;
    const rawValue = props.payload[rawKey];
    return [`${Math.round(value)}% (${Math.round(rawValue)}g)`, name];
  }}
/>
```

#### Updated Tooltip for Row 2 charts:
```tsx
<Tooltip
  contentStyle={{
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
  }}
/>
```

---

### Technical Notes
- Recharts' default tooltip behavior is to follow the cursor and only appear on hover
- The forced `visibility: 'visible'` was creating persistent empty tooltip wrappers
- The fixed `y: 100` position was causing overlap and z-index conflicts
- By removing these overrides, the tooltip will naturally appear near the hovered bar and disappear when not hovering

---

### Result
- No more blank squares below charts
- Tooltips appear cleanly on hover near the cursor
- Tooltips properly disappear when not hovering
- Macros (%) tooltip renders with correct background and z-order

