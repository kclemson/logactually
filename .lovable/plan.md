

## Position Tooltip Below Chart & Flip Macro Stacking Order

### Overview
Two changes:
1. Position tooltips below the X axis so they don't obscure chart bars
2. Flip the stacking order in Macros (%) chart so Protein (green) is on top and Fat (red) is on bottom

---

### Changes

**File: `src/pages/Trends.tsx`**

#### 1. Add tooltip positioning below X axis for all charts

Add `position` and `wrapperStyle` props to all Tooltip components to fix them below the chart area:

| Lines | Chart | Change |
|-------|-------|--------|
| 178-184 | Calories | Add `position={{ y: 100 }}` and `wrapperStyle={{ visibility: 'visible' }}` |
| 208-219 | Macros (%) | Add `position={{ y: 100 }}` and `wrapperStyle={{ visibility: 'visible' }}` |
| 248-254 | Row 2 charts | Add `position={{ y: 100 }}` and `wrapperStyle={{ visibility: 'visible' }}` |

Example updated Tooltip:
```tsx
<Tooltip
  position={{ y: 100 }}
  wrapperStyle={{ visibility: 'visible' }}
  contentStyle={{
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
  }}
/>
```

#### 2. Reverse macro bar stacking order

Current order (lines 220-222):
```tsx
<Bar dataKey="protein" ... />  // Bottom (green)
<Bar dataKey="carbs" ... />    // Middle (orange)
<Bar dataKey="fat" ... />      // Top (red)
```

New order (Fat on bottom, Protein on top):
```tsx
<Bar dataKey="fat" name="Fat" stackId="macros" fill="hsl(346 77% 49%)" radius={[0, 0, 0, 0]} />        // Bottom (red)
<Bar dataKey="carbs" name="Carbs" stackId="macros" fill="hsl(38 92% 50%)" radius={[0, 0, 0, 0]} />    // Middle (orange)
<Bar dataKey="protein" name="Protein" stackId="macros" fill="hsl(142 76% 36%)" radius={[2, 2, 0, 0]} /> // Top (green)
```

Note: The `radius={[2, 2, 0, 0]}` moves to the Protein bar since it's now on top.

---

### Technical Details

- `position={{ y: 100 }}` - Places tooltip at 100px from top of chart container (just below h-24 = 96px chart)
- `wrapperStyle={{ visibility: 'visible' }}` - Ensures tooltip remains visible when positioned outside default bounds
- Recharts stacks bars in the order they appear in JSX (first = bottom, last = top)

---

### Result
- Tooltips appear below X axis labels, keeping chart bars fully visible
- Macros (%) stacked colors from bottom to top: Red (Fat) → Orange (Carbs) → Green (Protein)
- Green protein section will be at the top of each stacked column

