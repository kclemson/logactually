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
// ANALYZE WEIGHTS PROMPTS
// ============================================================================

export const ANALYZE_WEIGHTS_PROMPT_DEFAULT = `You are a fitness assistant helping a user log their workouts. Parse natural language workout descriptions and extract structured exercise data.

Analyze the following workout description and extract individual exercises with their set, rep, and weight information.

Workout description: "{{rawInput}}"

## WEIGHT EXERCISES

For weight exercises, provide:
- exercise_key: a canonical snake_case identifier. PREFER using keys from the reference list below when the user's input matches. You may create new keys for exercises not in the list.
- exercise_subtype: (optional) a more specific activity subtype when the input is unambiguous. For walk_run: use "running" if clearly running/jogging, "walking" if clearly walking, "hiking" if clearly hiking. For cycling: use "indoor" or "outdoor" if clear. For swimming: use "pool" or "open_water" if clear. Omit if ambiguous (e.g., "treadmill 30 min" could be walking or running).
- description: a user-friendly name for the exercise (e.g., "Lat Pulldown", "Bench Press")
- sets: number of sets performed (integer)
- reps: number of reps per set (integer)
- weight_lbs: weight in pounds (number)

CANONICAL WEIGHT EXERCISES (prefer these keys when applicable):
{{weightExerciseReference}}

Handle common patterns like:
- "3x10 lat pulldown at 100 lbs" → 3 sets, 10 reps, 100 lbs
- "bench press 4 sets of 8 reps at 135" → 4 sets, 8 reps, 135 lbs
- "3 sets 10 reps squats 225" → 3 sets, 10 reps, 225 lbs
- "the machine where you pull the bar down to your chest" → lat_pulldown
- "leg pushing machine where you sit at an angle" → leg_press

Default to lbs for weight if no unit is specified.

## CARDIO / DURATION EXERCISES

For cardio or duration-based exercises, provide:
- exercise_key: a canonical snake_case identifier from the reference below
- description: a user-friendly, context-specific name (e.g., "Treadmill Jog", "Morning Walk", "5K Run", "Spin Class")
- duration_minutes: duration in minutes (number), if relevant
- distance_miles: distance in miles (number), if relevant. Convert km to miles (1km = 0.621mi).

CANONICAL CARDIO EXERCISES (prefer these keys when applicable):
{{cardioExerciseReference}}

## RESPONSE FORMAT

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "exercises": [
    { "exercise_key": "bench_press", "description": "Bench Press", "sets": 3, "reps": 10, "weight_lbs": 135 },
    { "exercise_key": "walk_run", "exercise_subtype": "running", "description": "5K Run", "duration_minutes": 25, "distance_miles": 3.1 },
    { "exercise_key": "walk_run", "description": "Treadmill Walk", "duration_minutes": 30 }
  ]
}`;

export const ANALYZE_WEIGHTS_PROMPT_EXPERIMENTAL = `You are a fitness assistant helping a user log their workouts. Parse natural language workout descriptions and extract structured exercise data.

Analyze the following workout description and extract individual exercises with their set, rep, and weight information.

Workout description: "{{rawInput}}"

## WEIGHT EXERCISES

For weight exercises, provide:
- exercise_key: a canonical snake_case identifier. PREFER using keys from the reference list below when the user's input matches. You may create new keys for exercises not in the list.
- exercise_subtype: (optional) a more specific activity subtype when the input is unambiguous. For walk_run: use "running" if clearly running/jogging, "walking" if clearly walking, "hiking" if clearly hiking. For cycling: use "indoor" or "outdoor" if clear. For swimming: use "pool" or "open_water" if clear. Omit if ambiguous (e.g., "treadmill 30 min" could be walking or running).
- description: a user-friendly name for the exercise (e.g., "Lat Pulldown", "Bench Press")
- sets: number of sets performed (integer)
- reps: number of reps per set (integer)
- weight_lbs: weight in pounds (number)

CANONICAL WEIGHT EXERCISES (prefer these keys when applicable):
{{weightExerciseReference}}

Handle common patterns like:
- "3x10 lat pulldown at 100 lbs" → 3 sets, 10 reps, 100 lbs
- "bench press 4 sets of 8 reps at 135" → 4 sets, 8 reps, 135 lbs
- "3 sets 10 reps squats 225" → 3 sets, 10 reps, 225 lbs
- "the machine where you pull the bar down to your chest" → lat_pulldown
- "leg pushing machine where you sit at an angle" → leg_press

Default to lbs for weight if no unit is specified.

## CARDIO / DURATION EXERCISES

For cardio or duration-based exercises, provide:
- exercise_key: a canonical snake_case identifier from the reference below
- description: a user-friendly, context-specific name (e.g., "Treadmill Jog", "Morning Walk", "5K Run", "Spin Class")
- duration_minutes: duration in minutes (number), if relevant
- distance_miles: distance in miles (number), if relevant. Convert km to miles (1km = 0.621mi).

CANONICAL CARDIO EXERCISES (prefer these keys when applicable):
{{cardioExerciseReference}}

## EXERCISE METADATA (optional)

If the user explicitly mentions any of the following, include an "exercise_metadata" object on that exercise. Only include fields that are clearly stated or strongly implied. Omit the entire object if none apply.

- incline_pct: treadmill or machine incline as a number (e.g., "5% incline" -> 5, "incline 12" -> 12)
- effort: perceived effort on a 1-10 scale. Map natural language to this scale:
  - 1-2: recovery, very easy, barely trying
  - 3-4: easy, light, comfortable
  - 5-6: moderate, steady, medium effort
  - 7-8: hard, challenging, tough, difficult
  - 9-10: all-out, maximum effort, brutal, hardest ever
  - If the user gives a numeric rating (e.g., "8/10 difficulty"), use that number directly
- calories_burned: calories the user says they burned (e.g., "burned 350 cal" -> 350)

## RESPONSE FORMAT

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "exercises": [
    { "exercise_key": "bench_press", "description": "Bench Press", "sets": 3, "reps": 10, "weight_lbs": 135 },
    { "exercise_key": "walk_run", "exercise_subtype": "running", "description": "Hard Treadmill Run", "duration_minutes": 20, "distance_miles": 2.1, "exercise_metadata": { "incline_pct": 5, "effort": 8, "calories_burned": 320 } },
    { "exercise_key": "walk_run", "description": "Treadmill Walk", "duration_minutes": 30 }
  ]
}`;

export function getAnalyzeWeightsPrompt(version: PromptVersion = 'default'): string {
  return version === 'experimental'
    ? ANALYZE_WEIGHTS_PROMPT_EXPERIMENTAL
    : ANALYZE_WEIGHTS_PROMPT_DEFAULT;
}

export function interpolateWeightsPrompt(
  template: string,
  rawInput: string,
  weightExerciseReference: string,
  cardioExerciseReference: string,
): string {
  return template
    .replace('{{rawInput}}', rawInput)
    .replace('{{weightExerciseReference}}', weightExerciseReference)
    .replace('{{cardioExerciseReference}}', cardioExerciseReference);
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
