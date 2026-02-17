

# Fix tooltip flicker on mobile tap for CalorieTargetRollup

## Problem

On touch devices, tapping the rollup row causes the tooltip to flash and disappear. Two competing mechanisms fight:

1. Radix Tooltip calls `onOpenChange(true)` from its internal pointer/focus handling
2. The `onClick` handler calls `setTooltipOpen(o => !o)`, which sees it as already `true` and flips it back to `false`

## Fix

**File: `src/components/CalorieTargetRollup.tsx`**

On touch devices (when `hasHover` is false), stop passing `onOpenChange` to Radix entirely. Only control the tooltip via the explicit `onClick` toggle. This prevents Radix from setting the state before the click handler runs.

Change:
```tsx
<Tooltip
  open={hasHover ? undefined : tooltipOpen}
  onOpenChange={hasHover ? undefined : setTooltipOpen}
>
```

To:
```tsx
<Tooltip
  open={hasHover ? undefined : tooltipOpen}
  onOpenChange={hasHover ? undefined : undefined}
>
```

Which simplifies to just removing the `onOpenChange` prop for touch:
```tsx
<Tooltip
  open={hasHover ? undefined : tooltipOpen}
>
```

The `onClick` handler already manages toggling correctly on its own. Without `onOpenChange`, Radix will not interfere with the controlled state on touch devices. On desktop (`hasHover` true), both props are `undefined`, letting Radix handle hover natively as before.

