
# Generate short group names for multi-item food entries

## Problem

When logging multiple food items in one input (e.g., "1.6oz of gouda, 4 slices of salami, and 130 calories of crackers with macros 4.5g fat, 22g"), the group header shows the entire raw input verbatim. The photo analysis flow already generates a short `summary` field for this purpose, but the text-based analysis does not.

## Solution

Add a `summary` field to the text-based `analyze-food` edge function response (matching what `analyze-food-photo` already does), and use it as the `group_name` on the client side instead of the raw input.

## Changes

### 1. Update prompt templates to request a `summary` field

**`supabase/functions/_shared/prompts.ts`**

Add to both prompt templates (default and experimental), in the JSON response format section:

```
"summary": "Short 2-4 word description of the overall meal/snack"
```

This goes alongside the existing `food_items` array in the response format example. Only needed when there are 2+ items.

### 2. Parse and return `summary` from the edge function

**`supabase/functions/analyze-food/index.ts`**

- Update the parsed type to include `summary?: string`
- Pass `parsed.summary` through to the response `AnalyzeResponse` interface
- Add `summary` field to the response object

### 3. Use `summary` as group name on the client

**`src/hooks/useAnalyzeFood.ts`**

- Add `summary` to the `AnalyzeResult` interface

**`src/pages/FoodLog.tsx`** (line 297)

- When creating a multi-item entry, prefer `result.summary` over raw input text for the `group_name`:

```
const groupName = result.food_items.length >= 2
  ? (result.summary || text)
  : null;
```

This is a graceful fallback -- if the AI doesn't return a summary for some reason, the raw input is still used.

## Result

A log like "1.6oz of gouda, 4 slices of salami, and 130 calories of crackers..." would show a group header like "Cheese & Crackers" or "Snack Plate" instead of the full sentence.

## Technical details

| File | Change |
|------|--------|
| `supabase/functions/_shared/prompts.ts` | Add `summary` field to both prompt response formats |
| `supabase/functions/analyze-food/index.ts` | Parse and return `summary` in response |
| `src/hooks/useAnalyzeFood.ts` | Add `summary` to `AnalyzeResult` type |
| `src/pages/FoodLog.tsx` | Use `result.summary` as `group_name` for multi-item entries |
