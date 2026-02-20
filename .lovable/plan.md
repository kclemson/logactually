
## Fix: OFF returns product with zero calories — should fall through to AI

### Root cause

The `lookup-upc` edge function currently returns any product that Open Food Facts marks `status: 1`, even if the nutritional data is entirely missing (all zeros). For barcode `74890286` (EAN-8), OFF has a stub record named "Chocolate Whey" with zero calories, zero protein, zero carbs, zero fat. The function returned that stub as a success, so the AI fallback was never reached.

Additionally, EAN-8 barcodes like `74890286` may have richer data in OFF under their zero-padded EAN-13 equivalent (`0074890286` → not quite right, but there is a standard zero-padding convention). A more useful secondary lookup strategy is to try the 13-digit version of the code.

### The two fixes

**Fix 1: Zero-calorie guard (primary fix)**

After computing calories from the OFF response, check whether the result has meaningful nutrition data before returning it. If `calories === 0` AND all of protein/carbs/fat are also 0, treat the OFF result as "not usable" and fall through to the AI fallback. Log that this happened clearly.

```typescript
// After computing calories, protein, carbs, fat:
const hasNutritionData = calories > 0 || protein > 0 || carbs > 0 || fat > 0;

if (!hasNutritionData) {
  console.log('OFF product found but has no nutrition data, falling through to AI');
  // Don't return — fall through to AI fallback below
} else {
  // Return the OFF result as before
  return new Response(JSON.stringify({ ... source: 'openfoodfacts' }), ...);
}
```

**Fix 2: EAN-8 → EAN-13 zero-pad retry**

EAN-8 codes (8 digits) are a compressed form. A simple convention is to try looking up the zero-padded 13-digit version (`00` prefix to reach 13 digits) if the first OFF lookup fails or returns no nutrition. Add a second OFF request with the padded code before falling to AI:

```typescript
// After first OFF attempt fails or returns no nutrition:
if (cleanUpc.length < 13) {
  const paddedUpc = cleanUpc.padStart(13, '0');
  if (paddedUpc !== cleanUpc) {
    // retry OFF with paddedUpc
  }
}
```

In this specific case: `74890286` (8 digits) → `0074890286` (10 digits) → `00074890286` (11) → `0000074890286` (13). This won't match `0748927028669`, so the zero-pad strategy alone won't solve *this specific product*, but Fix 1 (zero-calorie guard) will — it'll fall to AI, which knows what Optimum Nutrition Gold Standard Whey is.

### Priority

Fix 1 is the critical one and solves the immediate problem. Fix 2 is a nice defensive addition for EAN-8 codes that have data under their EAN-13 form.

### Files changed

| File | Change |
|---|---|
| `supabase/functions/lookup-upc/index.ts` | Add zero-calorie guard after parsing OFF nutrition data; add EAN-8 zero-pad retry attempt before AI fallback |

### Expected outcome

For `74890286` (Optimum Nutrition Gold Standard Whey):
1. OFF lookup finds stub "Chocolate Whey" → calories=0, protein=0, carbs=0, fat=0
2. Zero-calorie guard fires → log "OFF found product but no nutrition data, trying AI"
3. AI fallback runs → returns correct macros for Optimum Nutrition Gold Standard 100% Whey Chocolate
4. Entry logged with `source: 'ai'` and real nutritional values

No client-side changes needed. The hook and UI already handle both `openfoodfacts` and `ai` sources identically.
