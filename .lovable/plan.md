

# Limit Activity Icons Per Day in Calendar

## Problem
On mobile, days with many exercise types plus custom logs show 4+ icons that overflow the cell and break the layout. Desktop can handle 4 icons but mobile can only fit 3.

## Approach

**In `src/pages/History.tsx`**, add icon-limiting logic in the Row 3 rendering section:

1. **Detect mobile** using the existing `useIsMobile()` hook
2. **Build an ordered list of icons** for each day, then truncate to the limit (3 on mobile, 4 on desktop)
3. **Priority order** for which icons make the cut:
   - Custom log icon (ClipboardList) is guaranteed a slot if present AND exercise icons are also present
   - Exercise icons fill remaining slots in order: Dumbbell, Footprints, Bike, Activity

### Implementation detail

Replace the inline icon rendering (currently individual conditionals for each icon) with a computed array:

```typescript
const maxIcons = isMobile ? 3 : 4;

// Build candidate icons: exercise first, custom last
const exerciseIcons = [];
if (weightData?.hasLifting) exerciseIcons.push('lifting');
if (weightData?.hasRunWalk) exerciseIcons.push('runwalk');
if (weightData?.hasCycling) exerciseIcons.push('cycling');
if (weightData?.hasOtherCardio) exerciseIcons.push('othercardio');

const hasCustom = hasCustomLogs;
const hasExercise = exerciseIcons.length > 0;

// Reserve one slot for custom icon if both types present
const exerciseSlots = (hasCustom && hasExercise)
  ? maxIcons - 1
  : maxIcons;

const visibleExercise = exerciseIcons.slice(0, exerciseSlots);
// Then render visibleExercise icons + custom icon if present
```

This keeps the icon rendering deterministic and consistent. The `useIsMobile` hook is already available in the project (`src/hooks/use-mobile.tsx`).

### File changed
- `src/pages/History.tsx` -- add `useIsMobile` import, compute visible icons array, replace inline conditionals with mapped output

