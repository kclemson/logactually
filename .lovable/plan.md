

# Make section separators full-width and softer

## Changes

Both section separator lines get two tweaks: lower opacity (`/20` instead of `/30`) and negative margins (`-mx-3`) to span the full tooltip width.

| File | Line | From | To |
|------|------|------|----|
| `src/components/CalorieTargetTooltipContent.tsx` | 80 | `border-t border-muted-foreground/30 my-1` | `border-t border-muted-foreground/20 my-1 -mx-3` |
| `src/components/CalorieTargetRollup.tsx` | 158 | `border-t border-muted-foreground/30 my-1` | `border-t border-muted-foreground/20 my-1 -mx-3` |

No other files affected. The math underlines in the equation blocks remain unchanged at `/30`.
