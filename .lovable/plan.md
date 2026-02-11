

## Add AI-generated Summary for Photo Entries

### Problem
When a photo-based entry is expanded, it shows "Logged as: photo" which isn't useful. The AI should provide a brief description of what it saw in the photo (e.g., "Strawberry pretzel salad with whipped topping") to use as the `raw_input` instead.

### Changes

**1. `supabase/functions/_shared/prompts.ts`** -- Update `buildPhotoAnalysisPrompt()`
- Add a `summary` field to the expected JSON response schema, asking the AI to provide a short natural-language description of the meal/food it identified (e.g., "Grilled chicken salad with ranch dressing")
- Example addition to the response format:
  ```
  "summary": "A brief description of the food seen in the photo (1 short sentence, max ~60 chars)"
  ```

**2. `supabase/functions/analyze-food-photo/index.ts`** -- Pass summary through
- Extract `parsed.summary` from the AI response
- Include it in the returned result object as `summary: parsed.summary || null`

**3. `src/hooks/useAnalyzeFoodPhoto.ts`** -- Add `summary` to the result type
- Add `summary?: string` to the `AnalyzeResult` interface
- Pass it through from the edge function response

**4. `src/pages/FoodLog.tsx`** -- Use summary as `raw_input`
- In `handlePhotoSubmit`, use `result.summary || "photo"` instead of the hardcoded `"photo"` string when calling `createEntryFromItems`
- This means the expanded entry will show "Logged as: Strawberry pretzel salad with whipped topping" instead of "Logged as: photo"

### Files Changed
1. `supabase/functions/_shared/prompts.ts` -- add `summary` field to photo prompt schema
2. `supabase/functions/analyze-food-photo/index.ts` -- extract and return `summary`
3. `src/hooks/useAnalyzeFoodPhoto.ts` -- add `summary` to result type
4. `src/pages/FoodLog.tsx` -- use `result.summary` as `raw_input`
