

## Add Editable Hex Color Constants

Create a centralized `CHART_COLORS` constant at the top of Trends.tsx using hex RGB format for easy manual editing.

---

### What You'll Get

A clearly commented section at the top of the file where you can change any color:

```typescript
// Chart color palette (hex RGB format for easy editing)
const CHART_COLORS = {
  calories: '#0033CC',  // Deep Blue
  protein: '#115E83',   // Steel Blue
  carbs: '#00D4FF',     // Bright Cyan
  fat: '#B8F4FF',       // Light Cyan
} as const;
```

To change a color, simply update the hex value (e.g., change `'#115E83'` to `'#FF5733'`).

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Add CHART_COLORS constant after imports, update charts array and Macro Split bars to reference it |

---

### Code Changes

**1. Add color constants after imports (insert after line 25):**
```typescript
// Chart color palette (hex RGB format for easy editing)
const CHART_COLORS = {
  calories: '#0033CC',  // Deep Blue
  protein: '#115E83',   // Steel Blue
  carbs: '#00D4FF',     // Bright Cyan
  fat: '#B8F4FF',       // Light Cyan
} as const;
```

**2. Update charts array (line 262-267):**
```typescript
const charts = [
  { key: 'calories', label: 'Calories', color: CHART_COLORS.calories },
  { key: 'protein', label: 'Protein (g)', color: CHART_COLORS.protein },
  { key: 'carbs', label: 'Carbs (g)', color: CHART_COLORS.carbs },
  { key: 'fat', label: 'Fat (g)', color: CHART_COLORS.fat },
];
```

**3. Update Macro Split bars (lines 369-371):**
```typescript
<Bar dataKey="proteinPct" name="Protein" stackId="macros" fill={CHART_COLORS.protein} />
<Bar dataKey="carbsPct" name="Carbs" stackId="macros" fill={CHART_COLORS.carbs} />
<Bar dataKey="fatPct" name="Fat" stackId="macros" fill={CHART_COLORS.fat} radius={[2, 2, 0, 0]} />
```

---

### Result

All chart colors will be controlled from a single location at the top of the file. Change any hex value and all related charts update automatically.

