

## Reduce Macro Percentage Font Size

### Goal

Make the percentage text (16%/59%/25%) even smaller by going two font size steps below `text-xs`.

### Current vs Target

| State | Class | Size |
|-------|-------|------|
| Current | `text-xs` | 12px (0.75rem) |
| Target | `text-[8px]` | 8px |

Tailwind's smallest built-in class is `text-xs` (12px), so we'll use a custom size class to go smaller.

### Change

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Change `text-xs` to `text-[8px]` on the percentage div |

### Implementation

Update line 260 in TotalsRow:

```tsx
// Before
<div className="text-xs text-muted-foreground font-normal">
  {proteinPct}%/{carbsPct}%/{fatPct}%
</div>

// After
<div className="text-[8px] text-muted-foreground font-normal">
  {proteinPct}%/{carbsPct}%/{fatPct}%
</div>
```

### Visual Result

The percentages will appear noticeably smaller than the gram values above them, creating a stronger visual hierarchy where the percentages serve as subtle supplementary information.

