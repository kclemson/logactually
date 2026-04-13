

## Issue: Calorie-edit preview doesn't use `displayMacros`

### What's wrong

Line 843-844 in `FoodItemsTable.tsx`:
```ts
previewMacros 
  ? `${previewMacros.protein}/${previewMacros.carbs}/${previewMacros.fat}`
  : displayMacros.map(key => Math.round(getMacroValue(item, key))).join('/')
```

The non-editing path (line 845) correctly uses `displayMacros`. But the editing preview path (line 844) hardcodes `protein/carbs/fat` from the `ScaledMacros` type. If a user later configures `['protein', 'fiber', 'fat']`, the preview during calorie editing would show carbs instead of fiber.

### The deeper question: should calorie scaling affect non-P/C/F macros?

`scaleMacrosByCalories` proportionally scales protein, carbs, and fat because those are the calorie-contributing macronutrients. Fiber, sodium, cholesterol don't contribute to calories — scaling them proportionally when calories change would be scientifically incorrect.

**Decision**: When editing calories, the preview should still show the *user's chosen display macros*, but only the P/C/F values should actually change. Non-caloric macros (fiber, sodium, etc.) stay at their original values in the preview.

### Fix (one file)

**`src/components/FoodItemsTable.tsx`** — Change the preview rendering (line 843-844) to:

```ts
previewMacros 
  ? displayMacros.map(key => {
      // scaleMacrosByCalories only scales P/C/F — use scaled value if available, original otherwise
      if (key in previewMacros) return Math.round((previewMacros as any)[key]);
      return Math.round(getMacroValue(item, key));
    }).join('/')
  : displayMacros.map(key => Math.round(getMacroValue(item, key))).join('/')
```

This shows the user's chosen macros, uses the scaled value for protein/carbs/fat, and shows original values for non-caloric macros.

Similarly, the `onSaveNumeric` callback (lines 139-147) saves only P/C/F updates regardless of display — this is correct behavior and doesn't need changing. The display macros are a *view* concern; the underlying data model always stores all macros.

### Impact on Phase 1

With the default `['protein', 'carbs', 'fat']`, every key is in `previewMacros`, so behavior is identical to today. No regression risk, but the code is now correct for Phase 2.

### Scope

One file, one code block changed (~5 lines).

