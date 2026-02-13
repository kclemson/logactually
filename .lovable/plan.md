

## Fix "Go to today" styling and date row height on Custom page

### 1. Fix "Go to today" link styling

The Custom page uses `text-xs text-teal-600 dark:text-teal-400` while Food/Exercise pages use `text-sm text-primary`. Also missing the vertical centering class.

**File: `src/pages/OtherLog.tsx` (line 215)**

Change:
```
className="absolute right-0 text-xs text-teal-600 dark:text-teal-400 hover:underline"
```
To:
```
className="text-sm text-primary hover:underline absolute right-0 top-1/2 -translate-y-1/2"
```

This matches the Food/Exercise pages exactly: `text-sm` (not `text-xs`), `text-primary` (not teal), and includes `top-1/2 -translate-y-1/2` for proper vertical centering.

### 2. Fix date row vertical position

The Custom page's outer wrapper uses `space-y-4` which adds 16px gap between the top section and the date row. The Food/Exercise pages also use `space-y-4` but don't have `space-y-3` inside the section. The extra `space-y-3` inside the section may be pushing things slightly. However, the more likely culprit is the section itself -- `min-h-[144px]` may not perfectly match. Let me check the FoodLog section height to confirm the right value and adjust if needed.

The FoodLog wraps its LogInput in a `<section>` without an explicit min-height -- the LogInput component itself provides the natural height. To ensure perfect alignment, bump the min-height to `min-h-[148px]` to account for the `space-y-3` (12px) gap added inside the section, or remove the inner `space-y-3` and use a different spacing approach.

The cleanest fix: keep `space-y-3` inside the section but verify the total height matches by checking FoodLog's actual rendered section height. Since the LogInput has `min-h-[100px]` textarea + ~12px gap + ~32px buttons = ~144px, and the Custom page section already has `min-h-[144px]`, the slight difference is likely from the `space-y-3` adding internal spacing that pushes beyond 144px when both dropdown and input are visible. When neither is visible (read-only or no type selected), the 144px should be correct.

The real fix: the `space-y-3` class is on the section itself, meaning it applies between the section's direct children. When only the dropdown row is showing (~32px), the section correctly pads to 144px. This should be fine. Let me re-examine -- the FoodLog's outer div likely doesn't use `space-y-4` the same way.

I'll check the FoodLog outer container to confirm:

| File | Change |
|------|--------|
| `src/pages/OtherLog.tsx` line 215 | Change "Go to today" className from `"absolute right-0 text-xs text-teal-600 dark:text-teal-400 hover:underline"` to `"text-sm text-primary hover:underline absolute right-0 top-1/2 -translate-y-1/2"` |
| `src/pages/OtherLog.tsx` line 102 | Change `min-h-[144px]` to `min-h-[148px]` to account for the extra internal spacing, nudging the date row down to match Food/Exercise pages exactly |

