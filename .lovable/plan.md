

## Extract Shared Food Response Schema

### The Problem

Three places currently define the food item response format:
1. `ANALYZE_FOOD_PROMPT_DEFAULT` (lines 11-27, 33-37)
2. `ANALYZE_FOOD_PROMPT_EXPERIMENTAL` (lines 49-65, 71-75)  
3. `buildBulkFoodParsingPrompt` (lines 113, 121)

If you add a new nutrient field (like you did with fiber, sodium, etc.), you'd need to update all three places. The photo prompt would add a fourth.

---

### What Should Be Shared (Single Source of Truth)

These are the parts that define **what data we want back** - the schema:

| Shared Constant | Content | Lines in Current File |
|-----------------|---------|----------------------|
| `FOOD_ITEM_FIELDS` | Field definitions (name, portion, calories...cholesterol) | 11-22 / 49-60 |
| `FOOD_ITEM_JSON_EXAMPLE` | The JSON example object showing the schema | 36 / 74 / 113 |

---

### What Should Stay Separate Per Prompt

These parts are **context-specific** and should remain in each prompt template:

| Part | Why Separate |
|------|--------------|
| System context intro | Different framing for text vs photo vs experimental |
| Input placeholders | Text has `{{rawInput}}`, photo has none |
| Portion guidance | "mentioned or reasonable default" vs "visual estimation" |
| Confidence definitions | Could legitimately differ (brand lookup vs visual clarity) |
| Edge case handling | Text: portion fallback. Photo: "no food = empty array" |
| Naming guidance | Might want to tweak independently per prompt type |

---

### Proposed Shared Constants

```typescript
// ============================================================================
// SHARED SCHEMA CONSTANTS
// Single source of truth for food item response format
// ============================================================================

/**
 * Nutritional field definitions - what we ask the AI to return for each food item.
 * Update this when adding/removing nutrient fields.
 */
export const FOOD_ITEM_FIELDS = `- name: a SHORT, concise name (max 25 characters). Use common abbreviations. Do not include brand names unless essential for identification.
- portion: the serving size mentioned or a reasonable default
- calories: estimated calories (whole number)
- protein: grams of protein (whole number)
- carbs: grams of carbohydrates (whole number)
- fiber: grams of dietary fiber (whole number)
- sugar: grams of sugar (whole number)
- fat: grams of fat (whole number)
- saturated_fat: grams of saturated fat (whole number)
- sodium: milligrams of sodium (whole number)
- cholesterol: milligrams of cholesterol (whole number)`;

/**
 * JSON example showing the exact schema structure.
 * Used in response format instructions across all prompts.
 */
export const FOOD_ITEM_JSON_EXAMPLE = `{ "name": "Food name", "portion": "portion size", "calories": 0, "protein": 0, "carbs": 0, "fiber": 0, "sugar": 0, "fat": 0, "saturated_fat": 0, "sodium": 0, "cholesterol": 0, "confidence": "high", "source_note": "optional" }`;
```

---

### How Prompts Would Use Shared Constants

**DEFAULT prompt** (showing only the changed parts):

```typescript
export const ANALYZE_FOOD_PROMPT_DEFAULT = `You are a nutrition expert...

For each food item, provide:
${FOOD_ITEM_FIELDS}
- confidence: your certainty level for the nutritional data:
  - "high" = known brand with verified nutritional data...
  - "medium" = generic food with typical values...
  - "low" = estimate based on similar foods...
- source_note: (optional) brief note...

Keep names short and generic...

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "food_items": [
    ${FOOD_ITEM_JSON_EXAMPLE}
  ]
}`;
```

**PHOTO prompt** would use the same shared constants but with photo-specific confidence definitions.

**BULK prompt** would reference `FOOD_ITEM_JSON_EXAMPLE` in its results format.

---

### Line-by-Line Change Table for prompts.ts

| Lines | Current Content | After Refactor |
|-------|----------------|----------------|
| 1-3 | Comment header | Expanded to mention shared constants |
| NEW | *(doesn't exist)* | Add `FOOD_ITEM_FIELDS` constant |
| NEW | *(doesn't exist)* | Add `FOOD_ITEM_JSON_EXAMPLE` constant |
| 11-22 | Inline field definitions | Replace with `${FOOD_ITEM_FIELDS}` |
| 36 | Inline JSON example | Replace with `${FOOD_ITEM_JSON_EXAMPLE}` |
| 49-60 | Inline field definitions (duplicate) | Replace with `${FOOD_ITEM_FIELDS}` |
| 74 | Inline JSON example (duplicate) | Replace with `${FOOD_ITEM_JSON_EXAMPLE}` |
| 113 | Inline JSON example in bulk prompt | Replace with `${FOOD_ITEM_JSON_EXAMPLE}` |

---

### What This Enables

When you want to add a new field (e.g., `potassium`):

**Before**: Update 3+ places, easy to miss one
**After**: Update `FOOD_ITEM_FIELDS` and `FOOD_ITEM_JSON_EXAMPLE` once

---

### What Stays Separate (Intentionally)

| Part | Stays In | Reason |
|------|----------|--------|
| Confidence definitions | Each prompt | Photo vs text have legitimately different confidence criteria |
| `source_note` field | Each prompt | Tied to confidence, so kept together |
| Portion guidance line | Each prompt | "mentioned" vs "visual estimation" |
| System context | Each prompt | Input-type-specific framing |

---

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/_shared/prompts.ts` | Extract shared constants, update all prompts to use them |

---

### To Your Question About Scenarios

You asked if there's a scenario where different food-processing functions should return different syntax. I can't think of one either. The **schema** (what fields exist and their types) should always be consistent so:
- The frontend can parse any food result the same way
- CSV export works consistently
- TypeScript types stay accurate

The only legitimate differences are in **how we ask** (framing, confidence criteria) not **what we get back** (the schema).

