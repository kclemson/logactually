

# Ensure portion always has a fallback for barcode scans

## Problem
The edge function already defaults to `'1 serving'` for both the Open Food Facts and AI paths. However, the client hook `useScanBarcode.ts` treats `portion` as optional and passes it through without a fallback in `createFoodItemFromScan`. If the value is ever missing or empty, the portion scaling UI has nothing to display.

## Fix

### `src/hooks/useScanBarcode.ts`
In the `createFoodItemFromScan` function, add a fallback so `portion` is always set:

```
portion: result.portion || '1 serving'
```

This is a single-line change (around line 75) that acts as a safety net on the client side, complementing the server-side defaults already in place.

