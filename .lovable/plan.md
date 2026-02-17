

# Fix Tooltip Border Visibility in Dark Mode

## Problem

The tooltip border uses `border-border/50` (50% opacity). In dark mode, `--border` is already a subtle dark blue-gray (`217.2 32.6% 30%`) against the near-black popover background (`222.2 84% 4.9%`), so halving its opacity makes it nearly invisible. In light mode it works fine because the contrast is higher to begin with.

## Fix

Change `border-border/50` to `border-border` in two places:

| File | Change |
|------|--------|
| `src/components/ui/tooltip.tsx` | `border-border/50` to `border-border` |
| `src/components/trends/CompactChartTooltip.tsx` | `border-border/50` to `border-border` |

This uses the full-strength border color, which provides good contrast in both themes. No other files need changes -- these are the only two tooltip components.

