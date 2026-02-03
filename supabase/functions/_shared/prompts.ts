// Shared prompt templates for the analyze-food edge function
// Allows A/B testing different prompt versions
// Contains shared schema constants for consistent food item response format

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

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

export const ANALYZE_FOOD_PROMPT_DEFAULT = `You are a nutrition expert helping a user track their food intake for health goals. Accuracy is important. The user is logging food they consumed, so interpret their input as something they ate and identify the most likely food item(s).

Analyze the following food description and extract individual food items with their nutritional information.

Food description: "{{rawInput}}"
{{additionalContext}}

For each food item, provide:
${FOOD_ITEM_FIELDS}
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
    ${FOOD_ITEM_JSON_EXAMPLE}
  ]
}`;

// Stakes framing: adds user context, accuracy importance, and intent guidance
// Also includes confidence scoring for hallucination detection
export const ANALYZE_FOOD_PROMPT_EXPERIMENTAL = `You are a nutrition expert helping a user track their food intake for health goals. Accuracy is important. The user is logging food they consumed, so interpret their input as something they ate and identify the most likely food item(s).

Analyze the following food description and extract individual food items with their nutritional information.

Food description: "{{rawInput}}"
{{additionalContext}}

For each food item, provide:
${FOOD_ITEM_FIELDS}
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
    ${FOOD_ITEM_JSON_EXAMPLE}
  ]
}`;

export type PromptVersion = 'default' | 'experimental';

export function getAnalyzeFoodPrompt(version: PromptVersion = 'default'): string {
  return version === 'experimental' 
    ? ANALYZE_FOOD_PROMPT_EXPERIMENTAL 
    : ANALYZE_FOOD_PROMPT_DEFAULT;
}

export function interpolatePrompt(
  template: string,
  rawInput: string,
  additionalContext?: string
): string {
  return template
    .replace('{{rawInput}}', rawInput)
    .replace(
      '{{additionalContext}}',
      additionalContext ? `Additional context: "${additionalContext}"` : ''
    );
}

// ============================================================================
// BULK PARSING PROMPT HELPER
// Used by populate-demo-data to parse multiple food entries in a single AI call
// ============================================================================

export function buildBulkFoodParsingPrompt(inputs: string[]): string {
  return `Parse these ${inputs.length} food entries. For each input, analyze it exactly as you would individually, extracting all food items with their nutritional information.

Inputs:
${inputs.map((input, i) => `${i + 1}. "${input}"`).join('\n')}

Return JSON with results in the EXACT same order as the inputs above. Each result should contain the food_items array for that input:
{
  "results": [
    { "food_items": [${FOOD_ITEM_JSON_EXAMPLE}] },
    { "food_items": [...] },
    ...
  ]
}

IMPORTANT:
- Return exactly ${inputs.length} results, one for each input
- Keep names short (max 25 characters)
- Use realistic nutritional values based on typical serving sizes
- Multi-item inputs (e.g., "eggs and toast") should have multiple items in their food_items array`;
}
