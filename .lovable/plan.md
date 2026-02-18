

# Extract full nutrition data from barcode lookups

## Problem

The `lookup-upc` edge function only extracts calories, protein, carbs, and fat from Open Food Facts, even though the API provides sodium, fiber, sugar, saturated fat, and cholesterol. The AI fallback prompt also only requests the basic four. The client hook (`useScanBarcode`) similarly only passes those four fields through, so scanned items always show 0 for the right-column nutrients.

## Changes

### 1. `supabase/functions/lookup-upc/index.ts`

**Expand the `nutriments` interface** to include the missing fields:
- `fiber_serving` / `fiber_100g`
- `sugars_serving` / `sugars_100g`
- `saturated-fat_serving` / `saturated-fat_100g`
- `sodium_serving` / `sodium_100g`
- `cholesterol_serving` / `cholesterol_100g`

**Extract them** using the same per-serving-then-per-100g pattern already used for the basic four. Note: OFF stores sodium in grams but our app uses milligrams, so multiply by 1000. Same for cholesterol (OFF uses mg already, but worth confirming at extraction time).

**Add them to the JSON response** alongside the existing fields.

**Update the AI fallback prompt** to request `fiber`, `sugar`, `saturated_fat`, `sodium` (mg), and `cholesterol` (mg) in addition to the existing fields.

**Parse the expanded AI response** and include those fields in the returned JSON.

### 2. `src/hooks/useScanBarcode.ts`

**Expand the `LookupResult` interface** to include the new optional fields: `fiber`, `sugar`, `saturated_fat`, `sodium`, `cholesterol`.

**Pass them through** in both `lookupUpc` (response mapping) and `createFoodItemFromScan` (FoodItem creation).

### 3. No other files need changes

`FoodItem` already has `fiber`, `sugar`, `saturated_fat`, `sodium`, and `cholesterol` as optional fields. The `DetailDialog` food field layout already displays them. Once the scan result includes these values, they'll appear automatically.

## Technical details

Open Food Facts nutriment key names (note the hyphens, not underscores):
- `fiber_serving` / `fiber_100g`
- `sugars_serving` / `sugars_100g` (note: plural "sugars")
- `saturated-fat_serving` / `saturated-fat_100g` (hyphenated)
- `sodium_serving` / `sodium_100g` (in grams -- multiply by 1000 for mg)
- `cholesterol_serving` / `cholesterol_100g` (in mg)

## Files changed

| File | What |
|------|------|
| `supabase/functions/lookup-upc/index.ts` | Extract and return fiber, sugar, saturated_fat, sodium, cholesterol from OFF + AI |
| `src/hooks/useScanBarcode.ts` | Pass new fields through LookupResult and createFoodItemFromScan |

