

# Add tap-to-toggle tooltip on mobile for Food Log calorie total

## Problem

The calorie total tooltip in the Food Log's TotalsRow only works on hover (desktop). On mobile/touch devices there's no way to see it since there's no tap handler or controlled open state.

## Fix

**File: `src/components/FoodItemsTable.tsx`**

Apply the same tap-to-toggle pattern used by `CalorieTargetRollup` and other touch-friendly tooltips:

1. Import `useHasHover` and add `useState` for `tooltipOpen`
2. On the `Tooltip`, set `open={hasHover ? undefined : tooltipOpen}` so touch devices use controlled state while desktop uses native hover
3. On the `TooltipTrigger` content span, add `tabIndex={0}`, `role="button"`, and an `onClick` that toggles `tooltipOpen` when `!hasHover`
4. On `TooltipContent`, add `onPointerDownOutside={(e) => e.preventDefault()}` to prevent flicker (matching existing pattern)

### Before (lines ~207-224):
```tsx
<TooltipProvider delayDuration={150}>
  <Tooltip>
    <TooltipTrigger asChild>
      {calorieContent}
    </TooltipTrigger>
    <TooltipContent side="bottom" sideOffset={5}>
      ...
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### After:
```tsx
<TooltipProvider delayDuration={150}>
  <Tooltip open={hasHover ? undefined : tooltipOpen}>
    <TooltipTrigger asChild>
      <span
        className={cn("px-1 text-center inline-flex items-center justify-center", compact ? "text-xs" : "text-heading")}
        tabIndex={0}
        role="button"
        onClick={hasHover ? undefined : () => setTooltipOpen(o => !o)}
      >
        {Math.round(totals.calories)}
        <span className={...}>...</span>
      </span>
    </TooltipTrigger>
    <TooltipContent
      side="bottom"
      sideOffset={5}
      onPointerDownOutside={(e) => e.preventDefault()}
    >
      ...
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

The `hasHover` and `tooltipOpen` state will be added inside the `TotalsRow` component. This matches the exact pattern used in `CalorieTargetRollup` and the exercise log tooltips.

