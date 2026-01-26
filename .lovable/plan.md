

## Copy Experimental Prompt to Default

### Overview
Replace the current default prompt with the experimental prompt content, while preserving the experimental version unchanged as a backup.

---

### Changes

**File: `supabase/functions/_shared/prompts.ts`**

#### Replace `ANALYZE_FOOD_PROMPT_DEFAULT` content (lines 4-22)

The default prompt will be updated to include:
- Stakes framing ("helping a user track their food intake for health goals")
- Accuracy emphasis ("Accuracy is important")
- Intent guidance ("interpret their input as something they ate")
- Confidence field (`high`/`medium`/`low`)
- Source note field (optional)

```typescript
export const ANALYZE_FOOD_PROMPT_DEFAULT = `You are a nutrition expert helping a user track their food intake for health goals. Accuracy is important. The user is logging food they consumed, so interpret their input as something they ate and identify the most likely food item(s).

Analyze the following food description and extract individual food items with their nutritional information.

Food description: "{{rawInput}}"
{{additionalContext}}

For each food item, provide:
- name: a SHORT, concise name (max 25 characters). Use common abbreviations. Do not include brand names unless essential for identification.
- portion: the serving size mentioned or a reasonable default
- calories: estimated calories (whole number)
- protein: grams of protein (whole number)
- carbs: grams of carbohydrates (whole number)
- fat: grams of fat (whole number)
- confidence: your certainty level for the nutritional data:
  - "high" = known brand with verified nutritional data, or very common food with well-established values
  - "medium" = generic food with typical values, reasonable confidence
  - "low" = estimate based on similar foods, uncertain portion size, or ambiguous input
- source_note: (optional) brief note explaining your data source or estimation method, especially for "low" or "medium" confidence items

Keep names short and generic - focus on identifying the food type clearly in few words.

Be reasonable with portion sizes. If no portion is specified, use typical serving sizes.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "food_items": [
    { "name": "Food name", "portion": "portion size", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "confidence": "high", "source_note": "optional" }
  ]
}`;
```

#### Keep `ANALYZE_FOOD_PROMPT_EXPERIMENTAL` unchanged

The experimental prompt remains as-is for future A/B testing of new variations.

---

### What Changes

| Aspect | Before | After |
|--------|--------|-------|
| Default prompt | Basic nutrition expert role | Stakes framing + intent guidance |
| Confidence field | Not in default | Included in default |
| Source note field | Not in default | Included in default |
| Experimental prompt | Same as new default | Unchanged (serves as backup) |

---

### Result
- All users will now receive confidence scores and source notes by default
- The `promptVersion: 'experimental'` parameter still works (returns identical results)
- Future experiments can modify the experimental prompt without affecting production

