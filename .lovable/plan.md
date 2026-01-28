

## Reorder Macro Split Stacked Bars

Change the stacking order so protein appears at the top and fat at the bottom of each column.

---

### How Stacking Works in Recharts

In Recharts stacked bar charts, the **first** `<Bar>` component renders at the **bottom** of the stack, and subsequent bars stack on top. The `radius` prop for rounded corners should be on the **topmost** bar.

---

### Current Order (bottom to top)
1. Protein (bottom)
2. Carbs (middle)
3. Fat (top) - has rounded corners

### New Order (bottom to top)
1. Fat (bottom)
2. Carbs (middle)
3. Protein (top) - move rounded corners here

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Reverse order of Bar components in Macro Split chart |

---

### Code Change (lines 374-376)

**Before:**
```tsx
<Bar dataKey="proteinPct" name="Protein" stackId="macros" fill={CHART_COLORS.protein} />
<Bar dataKey="carbsPct" name="Carbs" stackId="macros" fill={CHART_COLORS.carbs} />
<Bar dataKey="fatPct" name="Fat" stackId="macros" fill={CHART_COLORS.fat} radius={[2, 2, 0, 0]} />
```

**After:**
```tsx
<Bar dataKey="fatPct" name="Fat" stackId="macros" fill={CHART_COLORS.fat} />
<Bar dataKey="carbsPct" name="Carbs" stackId="macros" fill={CHART_COLORS.carbs} />
<Bar dataKey="proteinPct" name="Protein" stackId="macros" fill={CHART_COLORS.protein} radius={[2, 2, 0, 0]} />
```

---

### Visual Result

```
Before:          After:
┌──────┐         ┌──────┐
│ Fat  │         │Protein│  ← top (dark)
├──────┤         ├──────┤
│Carbs │         │Carbs │  ← middle
├──────┤         ├──────┤
│Protein│        │ Fat  │  ← bottom (light)
└──────┘         └──────┘
```

Protein (darker blue) will now be at the top, fat (lightest cyan) at the bottom.

