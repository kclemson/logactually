

# Show rollup tooltips below the trigger

Add `side="bottom"` to the `TooltipContent` in the rollup tooltip so it appears below the 7-day / 30-day averages, consistent with the daily tooltips.

## Change

**File: `src/components/CalorieTargetRollup.tsx` (line 112-114)**

Add `side="bottom"` prop to `TooltipContent`:

```tsx
// Before
<TooltipContent
  sideOffset={5}
  onPointerDownOutside={(e) => e.preventDefault()}
>

// After
<TooltipContent
  side="bottom"
  sideOffset={5}
  onPointerDownOutside={(e) => e.preventDefault()}
>
```

Single prop addition, one file.
