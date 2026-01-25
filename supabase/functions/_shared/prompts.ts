// Shared prompt templates for the analyze-food edge function
// Allows A/B testing different prompt versions

export const ANALYZE_FOOD_PROMPT_DEFAULT = `You are a nutrition expert. Analyze the following food description and extract individual food items with their nutritional information.

Food description: "{{rawInput}}"
{{additionalContext}}

For each food item, provide:
- name: a SHORT, concise name (max 25 characters). Use common abbreviations. Do not include brand names unless essential for identification.
- portion: the serving size mentioned or a reasonable default
- calories: estimated calories (whole number)
- protein: grams of protein (whole number)
- carbs: grams of carbohydrates (whole number)
- fat: grams of fat (whole number)

Keep names short and generic - focus on identifying the food type clearly in few words.

Be reasonable with portion sizes. If no portion is specified, use typical serving sizes.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "food_items": [
    { "name": "Food name", "portion": "portion size", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
  ]
}`;

// Stakes framing: adds user context and accuracy importance
export const ANALYZE_FOOD_PROMPT_EXPERIMENTAL = `You are a nutrition expert helping a user track their food intake for health goals. Accuracy is important. Analyze the following food description and extract individual food items with their nutritional information.

Food description: "{{rawInput}}"
{{additionalContext}}

For each food item, provide:
- name: a SHORT, concise name (max 25 characters). Use common abbreviations. Do not include brand names unless essential for identification.
- portion: the serving size mentioned or a reasonable default
- calories: estimated calories (whole number)
- protein: grams of protein (whole number)
- carbs: grams of carbohydrates (whole number)
- fat: grams of fat (whole number)

Keep names short and generic - focus on identifying the food type clearly in few words.

Be reasonable with portion sizes. If no portion is specified, use typical serving sizes.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "food_items": [
    { "name": "Food name", "portion": "portion size", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
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
