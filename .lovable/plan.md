

# Fix: Include portion data from barcode scans

## Problem
When a barcode is scanned, the `lookup-upc` backend function returns a `portion` field (e.g., "1 bag", "1 serving"), but the client-side code in `useScanBarcode.ts` drops it. The `LookupResult` interface and `createFoodItemFromScan` function don't include `portion`, so scanned items never get portion data and the scaling UI can't be used.

## Solution
Add `portion` to the `LookupResult` interface and wire it through `createFoodItemFromScan`.

## Technical Details

**File: `src/hooks/useScanBarcode.ts`**

1. Add `portion` to the `LookupResult` interface:
   ```typescript
   interface LookupResult {
     description: string;
     portion?: string;
     calories: number;
     protein: number;
     carbs: number;
     fat: number;
     source: 'openfoodfacts' | 'ai';
   }
   ```

2. Include `portion` in the success response mapping (around line 48):
   ```typescript
   return {
     success: true,
     data: {
       description: data.description,
       portion: data.portion,
       calories: data.calories,
       ...
     },
   };
   ```

3. Include `portion` in `createFoodItemFromScan` (around line 69):
   ```typescript
   const createFoodItemFromScan = (result: LookupResult): Omit<FoodItem, 'uid' | 'entryId'> => {
     return {
       description: result.description,
       portion: result.portion,
       calories: result.calories,
       ...
     };
   };
   ```

No other files need changes -- `FoodInput` and `LogInput` already pass the returned food item through to the entry creation flow, which already handles `portion`.

