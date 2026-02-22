

# Add constant offset support to Chart DSL

## Problem
The user wants charts like "Food Calories - Exercise Calories Burned - 1486 (TDEE)" but the DSL only supports subtracting another data source metric via `compare`. There's no way to subtract a fixed number. The AI generates a DSL that mentions the constant in the title/aiNote but never actually applies it.

## Solution
Add an `offset` field to the ChartDSL schema. The engine subtracts this constant from each data point's value after the compare subtraction (if any). The AI prompt is updated so it knows to use `offset` when the user provides a fixed number to add or subtract.

## Technical Details

### 1. `src/lib/chart-types.ts` -- Add `offset` to ChartDSL

```typescript
// Add after the compare field:
/** Fixed constant subtracted from each data point (e.g., TDEE baseline). Applied after compare. */
offset?: number;
```

### 2. `src/lib/chart-dsl.ts` -- Apply offset in `executeDSL`

In the `date` case (~line 181), after the compare subtraction:

```typescript
if (dsl.offset) finalValue -= dsl.offset;
```

Same in the `week` case for weekly buckets.

Also include the offset in `_compareBreakdown` so the tooltip can show it:

```typescript
_compareBreakdown: (dsl.compare || dsl.offset) ? {
  primary: Math.round(value),
  primaryLabel: dsl.derivedMetric || dsl.metric,
  compare: cmpVal !== null ? Math.round(cmpVal) : null,
  compareLabel: cmpMetric,
  offset: dsl.offset ?? null,
} : undefined,
```

### 3. `src/components/trends/CompactChartTooltip.tsx` -- Show offset in tooltip

When `_compareBreakdown.offset` is present, render it as an additional line:

```
calories: 2100 . calories_burned: 321 . baseline: -1486
```

### 4. `supabase/functions/generate-chart-dsl/index.ts` -- Update AI prompt

Add `offset` to the DSL schema description so the AI knows to use it when users mention a fixed number to subtract or add.

| File | Change |
|---|---|
| `src/lib/chart-types.ts` | Add optional `offset?: number` field |
| `src/lib/chart-dsl.ts` | Apply offset after compare; include in breakdown metadata |
| `src/components/trends/CompactChartTooltip.tsx` | Render offset in tooltip |
| `supabase/functions/generate-chart-dsl/index.ts` | Add offset to DSL schema in AI prompt |

