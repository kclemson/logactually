

# Fix separator and math underline visibility in dark mode

## Problem

Both the section separator lines and the math equation underlines are nearly invisible in dark mode. The section separators use `border-muted-foreground/20` and the math underlines use `border-muted-foreground/30` inside an `opacity-75` parent -- both too faint on dark backgrounds.

## Solution

Switch all of them to `border-border`, the design system's standard border token that is already tuned for both light and dark themes. This ensures consistent visibility without manual opacity tuning.

The visual hierarchy is preserved because the math underlines still sit inside an `opacity-75` parent container, so they will naturally appear slightly softer than the full-opacity section separators.

## Changes

### `src/components/CalorieTargetTooltipContent.tsx`

| Line | Element | From | To |
|------|---------|------|----|
| 80 | Section separator | `border-muted-foreground/20` | `border-border` |
| ~125, ~142, ~155 | Math underlines in `TargetEquation` | `border-muted-foreground/30` | `border-border` |

### `src/components/CalorieTargetRollup.tsx`

| Line | Element | From | To |
|------|---------|------|----|
| 158 | Section separator | `border-muted-foreground/20` | `border-border` |
| ~63, ~94 | Math underlines in `renderEquationBlock` | `border-muted-foreground/30` | `border-border` |

Six total class changes across two files -- all just swapping the border color token. No structural or layout changes.

