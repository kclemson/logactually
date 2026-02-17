

# Fix Tooltip Theme Inversion Systemically

## Problem

The base `TooltipContent` component uses `bg-primary text-primary-foreground`. In this app's theme, `--primary` swaps between dark (light mode) and light (dark mode), so tooltips render with an inverted appearance: dark background in light mode, light background in dark mode. This affects all Radix tooltips (DCT tooltips, calorie burn tooltips, etc.) and is the opposite of what users expect.

Meanwhile, chart tooltips (`CompactChartTooltip`) manually hardcode `bg-white dark:bg-slate-800` which works correctly but doesn't use the design system variables.

## Approach

Fix the base `TooltipContent` component to use `bg-popover text-popover-foreground` (which correctly follows the theme) instead of `bg-primary text-primary-foreground`. Then update `CompactChartTooltip` to use the same popover variables so all tooltips are consistent. Also fix internal border colors that referenced `primary-foreground`.

Since `--popover` matches `--background` (light gray / dark navy), add a border and shadow to tooltips so they visually separate from the page.

## Technical Details

### 1. `src/components/ui/tooltip.tsx`

Change the default className from:
```
bg-primary text-primary-foreground
```
to:
```
bg-popover text-popover-foreground border border-border/50 shadow-md
```

This makes all Radix tooltips theme-aware by default. No per-usage overrides needed going forward.

### 2. `src/components/trends/CompactChartTooltip.tsx`

Replace `bg-white dark:bg-slate-800` and `text-slate-900 dark:text-slate-100` with `bg-popover text-popover-foreground` so chart tooltips use the same design tokens as Radix tooltips.

### 3. `src/components/CalorieTargetTooltipContent.tsx`

Change `border-primary-foreground/20` to `border-muted-foreground/30` on the two divider lines (line 66-67). Since the tooltip background is no longer `bg-primary`, `primary-foreground` is no longer the correct text context -- `muted-foreground` matches what the rollup component already uses for the same dividers.

### 4. `src/pages/Admin.tsx`

The Admin page tooltips already override with `bg-popover text-popover-foreground border` -- these overrides become redundant (since the base now matches) but are harmless. No changes needed.

| File | Change |
|------|--------|
| `src/components/ui/tooltip.tsx` | Base tooltip: `bg-popover text-popover-foreground border border-border/50 shadow-md` |
| `src/components/trends/CompactChartTooltip.tsx` | Use `bg-popover text-popover-foreground` instead of hardcoded white/slate |
| `src/components/CalorieTargetTooltipContent.tsx` | Divider borders: `border-muted-foreground/30` instead of `border-primary-foreground/20` |

