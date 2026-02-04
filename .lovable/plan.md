

## Add Compact Mode to FoodItemsTable for Similar Entry/Meal Prompts

### Summary
Add a `compact` prop to `FoodItemsTable` that reduces font sizes for use in the similar entry/meal prompt previews. The prop is **opt-in** with a default of `false`, so existing usages remain unchanged.

### Changes

**File: `src/components/FoodItemsTable.tsx`**

1. **Add `compact` prop to interface** (around line 62):
```typescript
/** When true, use smaller text for compact preview contexts */
compact?: boolean;
```

2. **Add prop with default in destructuring** (around line 88):
```typescript
compact = false,
```

3. **Update mini header row** (lines 380-387) - reduce from `text-[10px]` to `text-[9px]`:
```tsx
<div className={cn(
  'grid gap-0.5 items-center text-muted-foreground',
  compact ? 'text-[9px]' : 'text-[10px]',
  gridCols
)}>
```

4. **Update read-only data cells** (lines 562-569) - add conditional `text-xs`:
```tsx
<>
  <span className={cn(
    "px-1 py-1 text-muted-foreground text-center",
    compact && "text-xs"
  )}>
    {item.calories}
  </span>
  <span className={cn(
    "px-1 py-1 text-muted-foreground text-center",
    compact && "text-xs"
  )}>
    {Math.round(item.protein)}/{Math.round(item.carbs)}/{Math.round(item.fat)}
  </span>
</>
```

5. **Update description text** (around line 488-492) - add conditional `text-sm`:
```tsx
<span 
  title={getItemTooltip(item)}
  className={cn(
    "pl-1 pr-0 py-1 line-clamp-2 shrink min-w-0",
    compact && "text-sm"
  )}
>
```

6. **Update TotalsRow** (lines 305-313) - apply conditional sizing to totals:
```tsx
<span className={cn(
  "px-1 text-center",
  compact ? "text-xs" : "text-heading"
)}>{Math.round(totals.calories)}</span>
<span className={cn(
  "px-1 text-center",
  compact ? "text-xs" : "text-heading"
)}>
  <div>{Math.round(totals.protein)}/{Math.round(totals.carbs)}/{Math.round(totals.fat)}</div>
  {showMacroPercentages && (
    <div className={cn(
      "text-muted-foreground font-normal",
      compact ? "text-[8px]" : "text-[9px]"
    )}>
      {proteinPct}%/{carbsPct}%/{fatPct}%
    </div>
  )}
</span>
```

---

**File: `src/components/SimilarEntryPrompt.tsx`**

Pass `compact={true}` to FoodItemsTable (line ~50):
```tsx
<FoodItemsTable
  items={itemsWithUids}
  editable={false}
  showHeader={false}
  showTotals={true}
  totalsPosition="bottom"
  showInlineLabels={true}
  showMacroPercentages={false}
  showTotalsDivider={false}
  compact={true}
/>
```

---

**File: `src/components/SimilarMealPrompt.tsx`**

Pass `compact={true}` to FoodItemsTable (line ~47):
```tsx
<FoodItemsTable
  items={itemsWithUids}
  editable={false}
  showHeader={false}
  showTotals={true}
  totalsPosition="bottom"
  showInlineLabels={true}
  showMacroPercentages={false}
  showTotalsDivider={false}
  compact={true}
/>
```

### Result
- Existing FoodItemsTable usages (History, FoodLog, dialogs) remain completely unchanged
- Similar entry/meal prompts will display with smaller, more compact text
- Inline labels (Cal, P/C/F) remain visible for understandability
- Works consistently on both mobile and desktop

