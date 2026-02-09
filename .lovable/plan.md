

## Fix Calorie Target Dot Vertical Alignment

### Problem

The colored indicator dot (green/amber/rose) next to the calorie text appears slightly misaligned vertically. This is a text-level alignment issue within the calorie span, not a grid layout problem.

### Solution

Adjust the dot's vertical alignment so it sits centered with the calorie text. No changes to the grid layout at all -- just tweak the inline dot styling.

Also revert the previous unnecessary grid change (`grid-rows-[auto_auto_auto]` back to `grid-rows-3`) since it wasn't the issue.

### File Changed

| File | Change |
|------|--------|
| `src/pages/History.tsx` | Line 197: Revert `grid-rows-[auto_auto_auto]` back to `grid-rows-3` |
| `src/pages/History.tsx` | Line 219: Change the dot span from `align-middle` to something like `inline-flex items-center` or use a `leading-none` + `relative top-[-0.5px]` nudge to visually center the dot with the calorie text |

Two small CSS tweaks, zero layout changes.

