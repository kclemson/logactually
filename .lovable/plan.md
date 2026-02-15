

# CalorieTargetDialog Polish: 6 UI Fixes

## Changes

### 1. `src/components/CalorieTargetDialog.tsx` -- Reword activity hint (line 206)

Change from:
"Average ~191 calories/day burned over 27 active days. This is closest to..."

To:
"Your logged exercise burned an average of ~191 calories/day over 27 active days. This is closest to..."

### 2. `src/components/CalorieTargetDialog.tsx` -- Fix dropdown text wrapping (line 144)

The description text still wraps at `w-[240px]`. Widen the `SelectTrigger` to `w-[280px]` and add `whitespace-nowrap` to the description span (line 152) to prevent wrapping.

### 3. `src/components/CalorieTargetDialog.tsx` -- Prevent layout jumping on mode change

The current approach conditionally renders different sections (`{mode === 'static' && ...}`, `{mode === 'body_stats' && ...}`, etc.), causing the dialog height to jump when switching modes.

Fix: Add `min-h-[200px]` to the config body container so there's a stable minimum height that prevents the most jarring jumps. This keeps the dialog from collapsing to near-zero height when switching between modes with different amounts of controls.

### 4. `src/components/CalorieTargetDialog.tsx` -- Remove bold from final target in equation (lines 233-234)

Change `<strong className="text-foreground">` to just `<span className="text-foreground">` for the cal/day value in the TDEE summary. The equation result should not be bolded.

### 5. `src/components/CalorieTargetDialog.tsx` -- Fix equation left-alignment (line 231)

The summary `<p>` currently has `px-2` padding which indents it slightly from the labels above. Change to `px-0` (or remove horizontal padding entirely) so it aligns flush left with the other labels. Keep the vertical padding and background styling.

### 6. `src/components/CalorieTargetDialog.tsx` -- Always show deficit in equation (lines 232-234)

Currently the deficit is hidden when it equals 0. Change the logic so the deficit is always shown in the equation, even when 0:

```
Base metabolic rate ~1,248 x 1.375 = ~1,716 daily energy expenditure - 0 deficit = 1,716 cal/day
```

This makes the user aware that the deficit field is part of the calculation. Replace the two conditional branches (deficit > 0 and deficit === 0) with a single expression that always includes "- {deficit} deficit =".

---

## File Summary

| File | Changes |
|---|---|
| `src/components/CalorieTargetDialog.tsx` | All 6 fixes: reword hint, widen dropdown + nowrap, min-height, unbold target, flush-left equation, always show deficit |

