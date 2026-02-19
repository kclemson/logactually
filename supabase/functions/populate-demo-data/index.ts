import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAnalyzeFoodPrompt, buildBulkFoodParsingPrompt } from '../_shared/prompts.ts';

// Declare EdgeRuntime for background processing
declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================================================
// CONSTANTS
// ============================================================================

const DEMO_EMAIL = 'demo@logactually.com';
const BATCH_SIZE = 10;

// Calorie target distribution for demo data
const DAILY_CALORIE_TARGET = 2000;
const CALORIE_TIERS = {
  green: { min: 1700, max: 2050, percent: 75 },   // at or below target
  amber: { min: 2050, max: 2200, percent: 15 },    // slightly over
  red:   { min: 2200, max: 2600, percent: 10 },     // well over
} as const;

type CalorieTier = keyof typeof CALORIE_TIERS;

/** Assign each day index to a calorie tier based on the 75/15/10 distribution. */
function assignDayTiers(totalDays: number): CalorieTier[] {
  const tiers: CalorieTier[] = [];
  const greenCount = Math.round(totalDays * CALORIE_TIERS.green.percent / 100);
  const amberCount = Math.round(totalDays * CALORIE_TIERS.amber.percent / 100);
  // Red gets the rest
  const redCount = totalDays - greenCount - amberCount;

  for (let i = 0; i < greenCount; i++) tiers.push('green');
  for (let i = 0; i < amberCount; i++) tiers.push('amber');
  for (let i = 0; i < redCount; i++) tiers.push('red');

  // Shuffle so tiers are distributed randomly across days
  return shuffleArray(tiers);
}

/** Pre-compute total calories for each cached food input. */
function buildCalorieIndex(
  parsedCache: Map<string, ParsedFoodItem[]>
): Map<string, number> {
  const index = new Map<string, number>();
  for (const [input, items] of parsedCache) {
    index.set(input, items.reduce((sum, item) => sum + (item.calories || 0), 0));
  }
  return index;
}

/** Pick the meal from `candidates` whose calories bring `currentTotal` closest to `targetTotal`. */
function pickClosestMeal(
  candidates: string[],
  calorieIndex: Map<string, number>,
  currentTotal: number,
  targetTotal: number,
): string {
  let bestInput = candidates[0];
  let bestDiff = Infinity;
  for (const input of candidates) {
    const cals = calorieIndex.get(input) || 0;
    const diff = Math.abs((currentTotal + cals) - targetTotal);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestInput = input;
    }
  }
  return bestInput;
}

// ============================================================================
// DEMO FOOD INPUTS - Raw text inputs that will be parsed by AI
// 30 inputs per meal type, covering variety of styles
// ============================================================================

const DEMO_FOOD_INPUTS: Record<string, string[]> = {
  breakfast: [
    '2 eggs scrambled with buttered toast',
    'greek yogurt with granola and blueberries',
    'oatmeal with sliced banana and honey',
    'everything bagel with cream cheese',
    'whey protein shake with almond milk',
    'overnight oats with chia seeds and berries',
    'english muffin with peanut butter',
    'bowl of cheerios with 2% milk',
    'avocado toast on sourdough',
    'smoothie with spinach, banana, protein powder',
    'french toast with maple syrup (2 pieces)',
    'breakfast burrito with eggs, cheese, and salsa',
    'made scrambled eggs with cheddar cheese and some toast',
    'had a big bowl of oatmeal with blueberries and honey',
    'grabbed a breakfast sandwich from the cafe',
    'just coffee and a banana this morning',
    'Starbucks grande oat milk latte',
    'Chobani greek yogurt strawberry',
    'bacon and eggs with hashbrowns',
    '3 pancakes with butter and syrup',
    'hard boiled eggs (2) and an orange',
    'yogurt parfait with granola',
    'peanut butter banana smoothie',
    'croissant with jam',
    'cottage cheese with pineapple',
    'breakfast quesadilla with eggs and cheese',
    'cold brew coffee with oat milk',
    'toast with almond butter and sliced banana',
    'egg white omelette with spinach and feta',
    'acai bowl with granola and fruit',
  ],
  lunch: [
    'turkey sandwich on wheat with lettuce and tomato',
    'big salad with grilled chicken',
    'leftover spaghetti, about 2 cups',
    'chicken noodle soup with crusty bread',
    'chicken burrito bowl with rice beans and guac',
    'salmon roll, 8 pieces',
    'grilled cheese sandwich with tomato soup',
    'chicken wrap with veggies and ranch',
    'poke bowl with ahi tuna and rice',
    'falafel bowl with hummus and tabbouleh',
    'got chipotle - chicken bowl with guac',
    'ate leftover chicken stir fry from last night',
    'had a big salad with grilled chicken and ranch',
    'sandwich from the deli, turkey and swiss',
    'ramen from the place down the street',
    'meal prep chicken and rice',
    'panera bread bowl soup',
    "Trader Joe's mandarin orange chicken",
    'Costco rotisserie chicken (1/4)',
    'caesar salad with grilled shrimp',
    'veggie burger with sweet potato fries',
    'tuna salad on whole wheat',
    'leftover pizza (2 slices)',
    'hummus and veggie wrap',
    'mediterranean bowl with falafel',
    'teriyaki chicken with steamed rice',
    'BLT sandwich with chips',
    'sushi bento box',
    'greek salad with chicken',
    'ham and cheese croissant',
  ],
  dinner: [
    'baked salmon with roasted vegetables',
    'chicken stir fry with mixed veggies',
    'spaghetti with meat sauce, 2 cups',
    '3 beef tacos with cheese and salsa',
    '2 slices pepperoni pizza',
    'cheeseburger with medium fries',
    'grilled chicken breast with brown rice',
    'shrimp scampi over linguine',
    'beef and broccoli with steamed rice',
    '2 baked chicken thighs, bone-in',
    'cooked salmon in the air fryer with roasted veggies',
    'ordered thai food - pad thai and spring rolls',
    'homemade tacos with ground beef, like 3 of them',
    'grilled chicken breast with quinoa and asparagus',
    'spaghetti and meatballs, pretty big portion',
    'went out for sushi, had about 12 pieces plus miso soup',
    'made a big stir fry with tofu and vegetables',
    "made this: https://www.bonappetit.com/recipe/cacio-e-pepe",
    "made this: https://www.seriouseats.com/the-best-slow-cooked-bolognese-sauce-recipe",
    'ribeye steak with baked potato',
    'lasagna (one big slice) with garlic bread',
    'grilled pork chops with applesauce',
    'fish tacos with cabbage slaw',
    'butter chicken with naan bread',
    'roasted chicken with mashed potatoes',
    'lamb chops with mint sauce',
    'vegetable curry with jasmine rice',
    'stuffed bell peppers',
    'bbq pulled pork sandwich with coleslaw',
    'chicken parmesan with pasta',
  ],
  snack: [
    'apple slices with 2 tbsp peanut butter',
    'handful of almonds, about 20',
    'chocolate chip protein bar',
    '1 medium banana',
    'plain greek yogurt, 1 cup',
    'string cheese, 2 sticks',
    'baby carrots with hummus',
    'handful of trail mix',
    '3 cups popcorn, air popped',
    '2 rice cakes with almond butter',
    'needed something sweet so had some dark chocolate',
    'protein shake after workout',
    'handful of mixed nuts from the jar',
    'an apple and some peanut butter',
    'cheese and crackers',
    'Quest protein bar cookies and cream',
    'KIND dark chocolate nuts & sea salt bar',
    'Clif chocolate chip bar',
    'RXBAR chocolate sea salt',
    'celery sticks with peanut butter',
    'cottage cheese with berries',
    'beef jerky (1 oz)',
    'hard boiled egg',
    'edamame (1 cup)',
    'granola bar',
    'frozen grapes',
    'rice cakes with avocado',
    'mini pretzels (1 oz)',
    'dried mango slices',
    'roasted chickpeas',
  ],
};

// ============================================================================
// AI PARSING TYPES AND HELPERS
// ============================================================================

interface ParsedFoodItem {
  name: string;
  portion?: string;
  calories: number;
  protein: number;
  carbs: number;
  fiber?: number;
  sugar?: number;
  fat: number;
  saturated_fat?: number;
  sodium?: number;
  cholesterol?: number;
  confidence?: string;
}

interface BulkParseResult {
  results: Array<{ food_items: ParsedFoodItem[] }>;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callLovableAI(
  systemPrompt: string,
  userPrompt: string,
  retries = 2
): Promise<BulkParseResult> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`AI call attempt ${attempt + 1}...`);

      const models = ['google/gemini-3-flash-preview', 'openai/gpt-5-mini'];
      let response: Response | null = null;
      for (const model of models) {
        const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
          }),
        });
        if (res.ok) { response = res; break; }
        console.warn(`Model ${model} failed with ${res.status}, trying fallback...`);
        response = res;
      }

      if (!response || !response.ok) {
        const errorText = await response?.text() ?? 'no response';
        throw new Error(`AI call failed: ${response?.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in AI response');
      }

      // Clean up potential markdown code blocks
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      return JSON.parse(jsonStr) as BulkParseResult;
    } catch (error) {
      console.error(`AI call attempt ${attempt + 1} failed:`, error);
      if (attempt === retries) {
        throw error;
      }
      console.log(`Retrying in 1 second...`);
      await delay(1000);
    }
  }

  throw new Error('All AI call attempts failed');
}

async function bulkParseWithAI(
  inputs: string[],
  mealType: string
): Promise<Map<string, ParsedFoodItem[]>> {
  const results = new Map<string, ParsedFoodItem[]>();
  const systemPrompt = getAnalyzeFoodPrompt('default');

  console.log(`Processing ${inputs.length} ${mealType} inputs in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const batch = inputs.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(inputs.length / BATCH_SIZE);
    
    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} items)`);

    try {
      const userPrompt = buildBulkFoodParsingPrompt(batch);
      const response = await callLovableAI(systemPrompt, userPrompt);

      if (response.results && Array.isArray(response.results)) {
        response.results.forEach((r, idx) => {
          if (idx < batch.length && r.food_items) {
            results.set(batch[idx], r.food_items);
          }
        });
      }
    } catch (error) {
      console.error(`  Batch ${batchNum} failed:`, error);
      // Fall back to empty items for failed batch
      batch.forEach(input => {
        results.set(input, []);
      });
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < inputs.length) {
      await delay(200);
    }
  }

  return results;
}

// ============================================================================
// EXERCISE ABBREVIATIONS AND DATA
// ============================================================================

const EXERCISE_ABBREVIATIONS: Record<string, string[]> = {
  'Lat Pulldown': ['lat pull', 'pulldown', 'lats', 'pull down'],
  'Chest Press Machine': ['chest press', 'machine press'],
  'Leg Press': ['legpress', 'leg press machine'],
  'Leg Extension': ['leg ext', 'extensions', 'quads'],
  'Leg Curl': ['hamstring curl', 'leg curls', 'hams'],
  'Cable Row': ['seated row', 'cable rows', 'rows'],
  'Shoulder Press Machine': ['shoulder machine', 'machine shoulder'],
  'Squat': ['squats', 'back squat', 'bb squat'],
  'Bench Press': ['bench', 'bp', 'flat bench', 'bb bench'],
  'Deadlift': ['deads', 'dl', 'conventional dl'],
  'Romanian Deadlift': ['rdl', 'romanian dl', 'stiff leg'],
  'Bicep Curl': ['curls', 'biceps', 'bi curls', 'arm curls'],
  'Shoulder Press': ['ohp', 'overhead press', 'military'],
  'Dumbbell Row': ['db row', 'one arm row', 'db rows'],
  'Lateral Raise': ['side raise', 'laterals', 'side delts'],
  'Hammer Curl': ['hammers', 'hammer curls', 'neutral curls'],
};

const EXERCISES = {
  machine: [
    { key: 'lat_pulldown', name: 'Lat Pulldown', startWeight: 70, maxProgress: 25 },
    { key: 'chest_press_machine', name: 'Chest Press Machine', startWeight: 50, maxProgress: 30 },
    { key: 'leg_press', name: 'Leg Press', startWeight: 90, maxProgress: 90 },
    { key: 'leg_extension', name: 'Leg Extension', startWeight: 40, maxProgress: 30 },
    { key: 'leg_curl', name: 'Leg Curl', startWeight: 35, maxProgress: 25 },
    { key: 'seated_row', name: 'Cable Row', startWeight: 50, maxProgress: 25 },
    { key: 'shoulder_press_machine', name: 'Shoulder Press Machine', startWeight: 30, maxProgress: 25 },
  ],
  compound: [
    { key: 'squat', name: 'Squat', startWeight: 65, maxProgress: 50 },
    { key: 'bench_press', name: 'Bench Press', startWeight: 65, maxProgress: 30 },
    { key: 'deadlift', name: 'Deadlift', startWeight: 95, maxProgress: 60 },
    { key: 'romanian_deadlift', name: 'Romanian Deadlift', startWeight: 65, maxProgress: 40 },
  ],
  freeWeight: [
    { key: 'bicep_curl', name: 'Bicep Curl', startWeight: 15, maxProgress: 10 },
    { key: 'shoulder_press', name: 'Shoulder Press', startWeight: 20, maxProgress: 15 },
    { key: 'dumbbell_row', name: 'Dumbbell Row', startWeight: 25, maxProgress: 15 },
    { key: 'lateral_raise', name: 'Lateral Raise', startWeight: 10, maxProgress: 10 },
    { key: 'hammer_curl', name: 'Hammer Curl', startWeight: 15, maxProgress: 10 },
  ],
};

const SAVED_MEAL_TEMPLATES = [
  { name: 'Morning Coffee', items: ['grande oat milk latte', 'banana'] },
  { name: 'Chipotle Bowl', items: ['chicken burrito bowl with rice, beans, salsa, guac'] },
  { name: 'Weeknight Salmon', items: ['6oz baked salmon', 'roasted vegetables', 'brown rice'] },
  { name: 'Protein Snack', items: ['greek yogurt with granola', 'protein bar'] },
  { name: 'Pizza Night', items: ['3 slices pepperoni pizza', 'side salad with ranch'] },
  { name: 'Quick Breakfast', items: ['2 scrambled eggs', 'toast with butter', 'orange juice'] },
  { name: 'Lunch Salad', items: ['mixed greens with grilled chicken', 'balsamic dressing', 'croutons'] },
  { name: 'Post-Workout', items: ['protein shake with banana', 'peanut butter toast'] },
];

const SAVED_ROUTINE_TEMPLATES = [
  { name: 'Upper Body Day', exercises: ['bench_press', 'lat_pulldown', 'shoulder_press', 'bicep_curl', 'seated_row'] },
  { name: 'Leg Day', exercises: ['squat', 'leg_press', 'leg_extension', 'leg_curl'] },
  { name: 'Full Body Quick', exercises: ['squat', 'bench_press', 'lat_pulldown', 'bicep_curl'] },
  { name: 'Push Day', exercises: ['bench_press', 'shoulder_press_machine', 'chest_press_machine', 'lateral_raise'] },
  { name: 'Pull Day', exercises: ['lat_pulldown', 'seated_row', 'bicep_curl', 'hammer_curl', 'dumbbell_row'] },
  { name: 'Machine Circuit', exercises: ['chest_press_machine', 'lat_pulldown', 'leg_press', 'shoulder_press_machine'] },
  { name: 'Cardio Day', exercises: ['walk_run', 'elliptical'] },
  { name: 'Cardio + Strength', exercises: ['walk_run', 'bench_press', 'lat_pulldown', 'bicep_curl'] },
];

// ============================================================================
// CARDIO & CASUAL ACTIVITY DATA
// ============================================================================

interface CardioActivityDef {
  key: string;
  subtype: string | null;
  description: string;
  durationMin: number;
  durationMax: number;
  distanceMin?: number;
  distanceMax?: number;
  inputTemplates: ((dur: number, dist?: number) => string)[];
}

const CARDIO_EXERCISES: CardioActivityDef[] = [
  {
    key: 'walk_run', subtype: 'walking', description: 'Walking',
    durationMin: 15, durationMax: 20, distanceMin: 0.7, distanceMax: 1.2,
    inputTemplates: [
      (dur, dist) => `walked ${dur} min`,
      (dur, dist) => `morning walk, about ${dist} miles`,
      (dur, dist) => `quick walk ${dur} min`,
      (dur, dist) => `walked ${dist} mi ${dur} min`,
    ],
  },
  {
    key: 'walk_run', subtype: 'running', description: 'Running',
    durationMin: 20, durationMax: 35, distanceMin: 2, distanceMax: 4,
    inputTemplates: [
      (dur, dist) => `ran ${dist} miles ${dur} min`,
      (dur, dist) => `went for a run, ${dist} miles in ${dur} min`,
      (dur, dist) => `run ${dur} min`,
      (dur, dist) => `jogged ${dist} miles`,
    ],
  },
  {
    key: 'cycling', subtype: 'outdoor', description: 'Cycling',
    durationMin: 25, durationMax: 45, distanceMin: 5, distanceMax: 12,
    inputTemplates: [
      (dur, dist) => `bike ride ${dist} miles ${dur} min`,
      (dur, dist) => `rode my bike around the neighborhood, maybe ${dist} miles`,
      (dur, dist) => `cycling ${dur} min, about ${dist} miles`,
    ],
  },
  {
    key: 'cycling', subtype: 'indoor', description: 'Stationary Bike',
    durationMin: 15, durationMax: 30,
    inputTemplates: [
      (dur) => `spin bike ${dur} min`,
      (dur) => `stationary bike ${dur} min`,
      (dur) => `${dur} min on the exercise bike`,
    ],
  },
  {
    key: 'elliptical', subtype: null, description: 'Elliptical',
    durationMin: 20, durationMax: 35,
    inputTemplates: [
      (dur) => `elliptical ${dur} min`,
      (dur) => `${dur} min on the elliptical`,
      (dur) => `elliptical machine ${dur} minutes`,
    ],
  },
  {
    key: 'swimming', subtype: null, description: 'Swimming',
    durationMin: 20, durationMax: 40,
    inputTemplates: [
      (dur) => `swam laps ${dur} min`,
      (dur) => `swimming ${dur} minutes`,
      (dur) => `${dur} min in the pool`,
    ],
  },
  {
    key: 'rowing', subtype: null, description: 'Rowing',
    durationMin: 15, durationMax: 25,
    inputTemplates: [
      (dur) => `rower ${dur} min`,
      (dur) => `rowing machine ${dur} min`,
      (dur) => `rowed ${dur} minutes`,
    ],
  },
  {
    key: 'stair_climber', subtype: null, description: 'Stairmaster',
    durationMin: 15, durationMax: 25,
    inputTemplates: [
      (dur) => `stairmaster ${dur} min`,
      (dur) => `stair climber ${dur} min`,
      (dur) => `${dur} min on the stairmaster`,
    ],
  },
];

const CASUAL_ACTIVITIES: CardioActivityDef[] = [
  {
    key: 'functional_strength', subtype: 'gardening', description: 'Gardening',
    durationMin: 30, durationMax: 60,
    inputTemplates: [
      (dur) => `gardening ${dur} min`,
      (dur) => `gardening ${dur} min, planting and weeding`,
      (dur) => `worked in the garden for about ${dur} minutes`,
    ],
  },
  {
    key: 'functional_strength', subtype: 'yard_work', description: 'Yard Work',
    durationMin: 30, durationMax: 75,
    inputTemplates: [
      (dur) => `yard work mowing and raking ${dur} min`,
      (dur) => `did yard work for about ${dur >= 60 ? Math.round(dur / 60 * 10) / 10 + ' hr' : dur + ' min'}`,
      (dur) => `mowed the lawn and raked leaves ${dur} min`,
    ],
  },
  {
    key: 'functional_strength', subtype: 'cleaning', description: 'House Cleaning',
    durationMin: 30, durationMax: 90,
    inputTemplates: [
      (dur) => `deep cleaned the house ${dur} min`,
      (dur) => `house cleaning ${dur} min`,
      (dur) => `cleaned the house for about ${dur >= 60 ? Math.round(dur / 60 * 10) / 10 + ' hours' : dur + ' min'}`,
    ],
  },
  {
    key: 'walk_run', subtype: 'hiking', description: 'Hiking',
    durationMin: 60, durationMax: 120, distanceMin: 2, distanceMax: 5,
    inputTemplates: [
      (dur, dist) => `hiked ${dist} miles, about ${dur >= 60 ? Math.round(dur / 60 * 10) / 10 + ' hours' : dur + ' min'}`,
      (dur, dist) => `went hiking, ${dist} miles in ${dur} min`,
      (dur, dist) => `trail hike ${dist} mi`,
    ],
  },
  {
    key: 'functional_strength', subtype: 'playing_with_kids', description: 'Playing with Kids',
    durationMin: 30, durationMax: 60,
    inputTemplates: [
      (dur) => `played outside with kids ${dur} min`,
      (dur) => `playing with the kids at the park ${dur} min`,
      (dur) => `ran around with the kids for about ${dur} minutes`,
    ],
  },
];

function generateCardioEntry(activity: CardioActivityDef): GeneratedExercise {
  const duration = randomInt(activity.durationMin, activity.durationMax);
  let distance: number | undefined;
  if (activity.distanceMin != null && activity.distanceMax != null) {
    distance = Math.round((activity.distanceMin + Math.random() * (activity.distanceMax - activity.distanceMin)) * 10) / 10;
  }
  const template = randomChoice(activity.inputTemplates);
  const rawInput = template(duration, distance);
  return {
    exercise_key: activity.key,
    exercise_subtype: activity.subtype,
    description: activity.description,
    sets: 0,
    reps: 0,
    weight_lbs: 0,
    duration_minutes: duration,
    distance_miles: distance ?? null,
    rawInput,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function selectRandomDays(startDate: Date, endDate: Date, count: number): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return shuffleArray(days).slice(0, Math.min(count, days.length)).sort((a, b) => a.getTime() - b.getTime());
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateCasualExerciseInput(
  exerciseName: string,
  weight: number,
  sets: number,
  reps: number
): string {
  const abbreviations = EXERCISE_ABBREVIATIONS[exerciseName];
  const name = abbreviations 
    ? randomChoice(abbreviations) 
    : exerciseName.toLowerCase().replace(/ /g, '');
  
  const formats = [
    () => `${name} ${weight} ${sets}x${reps}`,
    () => `${name} ${sets}x${reps} @ ${weight}`,
    () => `${name} ${weight}lb ${sets}x${reps}`,
    () => `${name} ${sets}x${reps} ${weight}lbs`,
    () => `${name} ${weight} ${sets} sets ${reps} reps`,
    () => `${name} ${sets}sets ${reps}reps ${weight}`,
  ];
  
  return randomChoice(formats)();
}

// ============================================================================
// WEIGHT GENERATION
// ============================================================================

interface WeightConfig {
  machinePercent: number;
  compoundPercent: number;
  freeWeightPercent: number;
  progressionMultiplier: number;
}

const DEFAULT_WEIGHT_CONFIG: WeightConfig = {
  machinePercent: 40,
  compoundPercent: 30,
  freeWeightPercent: 30,
  progressionMultiplier: 1.0,
};

function selectExerciseCategory(config: WeightConfig): 'machine' | 'compound' | 'freeWeight' {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  cumulative += config.machinePercent;
  if (rand < cumulative) return 'machine';
  
  cumulative += config.compoundPercent;
  if (rand < cumulative) return 'compound';
  
  return 'freeWeight';
}

function calculateWeight(
  baseWeight: number,
  maxProgress: number,
  dayIndex: number,
  totalDays: number,
  progressionMultiplier: number
): number {
  const progress = (dayIndex / Math.max(totalDays, 1)) * maxProgress * progressionMultiplier;
  const variance = (Math.random() - 0.5) * 5;
  return Math.max(5, Math.round((baseWeight + progress + variance) / 5) * 5);
}

function calculateSetsReps(dayIndex: number, totalDays: number): { sets: number; reps: number } {
  const progress = dayIndex / Math.max(totalDays, 1);
  return {
    sets: progress > 0.5 ? 4 : 3,
    reps: Math.min(12, 8 + Math.floor(progress * 4)),
  };
}

interface GeneratedExercise {
  exercise_key: string;
  exercise_subtype?: string | null;
  description: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  duration_minutes?: number | null;
  distance_miles?: number | null;
  rawInput?: string;
}

function generateWeightEntriesForDay(
  config: WeightConfig,
  dayIndex: number,
  totalDays: number
): { rawInput: string; exercises: GeneratedExercise[] } {
  const exerciseCount = randomInt(3, 6);
  const usedKeys = new Set<string>();
  const exercises: GeneratedExercise[] = [];
  const inputParts: string[] = [];
  
  for (let i = 0; i < exerciseCount; i++) {
    const category = selectExerciseCategory(config);
    const availableExercises = EXERCISES[category].filter(e => !usedKeys.has(e.key));
    
    if (availableExercises.length === 0) continue;
    
    const exercise = randomChoice(availableExercises);
    usedKeys.add(exercise.key);
    
    const { sets, reps } = calculateSetsReps(dayIndex, totalDays);
    const weight = calculateWeight(
      exercise.startWeight,
      exercise.maxProgress,
      dayIndex,
      totalDays,
      config.progressionMultiplier
    );
    
    exercises.push({
      exercise_key: exercise.key,
      description: exercise.name,
      sets,
      reps,
      weight_lbs: weight,
    });
    
    inputParts.push(generateCasualExerciseInput(exercise.name, weight, sets, reps));
  }
  
  const separator = randomChoice([', ', '\n', ' | ', '; ']);
  const rawInput = inputParts.join(separator);
  
  return { rawInput, exercises };
}

// ============================================================================
// SAVED ITEMS GENERATION
// ============================================================================

function generateSavedMeals(
  count: number,
  parsedCache: Map<string, ParsedFoodItem[]>
): Array<{ name: string; original_input: string; food_items: unknown[]; use_count: number }> {
  const templates = shuffleArray(SAVED_MEAL_TEMPLATES).slice(0, count);
  
  return templates.map(template => {
    const originalInput = template.items.join(', ');
    const parsedItems = parsedCache.get(originalInput) || [];
    
    return {
      name: template.name,
      original_input: originalInput,
      food_items: parsedItems.length > 0
        ? parsedItems.map((item, idx) => ({
            uid: `saved-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
            description: item.name,
            portion: item.portion,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fiber: item.fiber,
            sugar: item.sugar,
            fat: item.fat,
            saturated_fat: item.saturated_fat,
            sodium: item.sodium,
            cholesterol: item.cholesterol,
            confidence: item.confidence,
          }))
        : template.items.map((item, idx) => ({
            // Fallback to basic structure if AI parsing failed
            uid: `saved-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
            description: item,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          })),
      use_count: randomInt(2, 10),
    };
  });
}

function generateSavedRoutines(count: number): Array<{ name: string; original_input: string; exercise_sets: unknown[]; use_count: number }> {
  const templates = shuffleArray(SAVED_ROUTINE_TEMPLATES).slice(0, count);
  
  return templates.map(template => {
    const exerciseSets = template.exercises.map(key => {
      // Check if it's a cardio exercise
      const cardioMatch = CARDIO_EXERCISES.find(c => c.key === key);
      if (cardioMatch) {
        return {
          exercise_key: cardioMatch.key,
          exercise_subtype: cardioMatch.subtype,
          description: cardioMatch.description,
          sets: 0,
          reps: 0,
          weight_lbs: 0,
          duration_minutes: randomInt(cardioMatch.durationMin, cardioMatch.durationMax),
        };
      }

      const allExercises = [...EXERCISES.machine, ...EXERCISES.compound, ...EXERCISES.freeWeight];
      const exercise = allExercises.find(e => e.key === key) || { key, name: key, startWeight: 50 };
      
      return {
        exercise_key: exercise.key,
        description: exercise.name,
        sets: randomInt(3, 4),
        reps: randomInt(8, 12),
        weight_lbs: exercise.startWeight,
      };
    });
    
    return {
      name: template.name,
      original_input: template.exercises.join(', '),
      exercise_sets: exerciseSets,
      use_count: randomInt(3, 8),
    };
  });
}

// ============================================================================
// BACKGROUND WORK FUNCTION
// ============================================================================

interface PopulationParams {
  startDate: Date;
  endDate: Date;
  daysToPopulate: number;
  generateFood: boolean;
  generateWeights: boolean;
  generateCustomLogs: boolean;
  savedMealsCount: number;
  savedRoutinesCount: number;
  clearExisting: boolean;
  weightConfig: WeightConfig;
}

async function doPopulationWork(
  params: PopulationParams,
  demoUserId: string,
  // deno-lint-ignore no-explicit-any
  serviceClient: any
): Promise<void> {
  const {
    startDate,
    endDate,
    daysToPopulate,
    generateFood,
    generateWeights,
    generateCustomLogs,
    savedMealsCount,
    savedRoutinesCount,
    clearExisting,
    weightConfig,
  } = params;

  try {
    // Clear existing data if requested
    if (clearExisting) {
      console.log('Clearing existing data...');
      
      if (generateFood) {
        const { error: clearFoodError } = await serviceClient
          .from('food_entries')
          .delete()
          .eq('user_id', demoUserId)
          .gte('eaten_date', formatDate(startDate))
          .lte('eaten_date', formatDate(endDate));
        
        if (clearFoodError) console.error('Error clearing food:', clearFoodError);
      }

      if (generateWeights) {
        const { error: clearWeightError } = await serviceClient
          .from('weight_sets')
          .delete()
          .eq('user_id', demoUserId)
          .gte('logged_date', formatDate(startDate))
          .lte('logged_date', formatDate(endDate));
        
        if (clearWeightError) console.error('Error clearing weights:', clearWeightError);
      }

      if (savedMealsCount > 0) {
        const { error: clearMealsError } = await serviceClient
          .from('saved_meals')
          .delete()
          .eq('user_id', demoUserId);
        
        if (clearMealsError) console.error('Error clearing saved meals:', clearMealsError);
      }

      if (savedRoutinesCount > 0) {
        const { error: clearRoutinesError } = await serviceClient
          .from('saved_routines')
          .delete()
          .eq('user_id', demoUserId);
        
        if (clearRoutinesError) console.error('Error clearing saved routines:', clearRoutinesError);
      }
    }

    // ========================================================================
    // BULK AI PARSING FOR FOOD DATA
    // ========================================================================
    
    const parsedCache = new Map<string, ParsedFoodItem[]>();
    
    if (generateFood) {
      console.log('Starting bulk AI parsing for food entries...');
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
      
      for (const mealType of mealTypes) {
        const inputs = DEMO_FOOD_INPUTS[mealType];
        const results = await bulkParseWithAI(inputs, mealType);
        results.forEach((items, input) => parsedCache.set(input, items));
      }
      
      console.log(`Parsed ${parsedCache.size} unique food inputs`);
    }

    // ========================================================================
    // AI PARSING FOR SAVED MEALS
    // ========================================================================
    
    if (savedMealsCount > 0) {
      console.log('Starting AI parsing for saved meal templates...');
      // Parse ALL templates so any shuffled selection will have cached data
      const savedMealInputs = SAVED_MEAL_TEMPLATES.map(t => t.items.join(', '));
      const savedMealResults = await bulkParseWithAI(savedMealInputs, 'savedmeals');
      savedMealResults.forEach((items, input) => parsedCache.set(input, items));
      console.log(`Parsed ${savedMealInputs.length} saved meal templates`);
    }

    // Select random days within range
    const selectedDays = selectRandomDays(startDate, endDate, daysToPopulate);
    console.log(`Selected ${selectedDays.length} days to populate`);

    let foodEntriesCreated = 0;
    let weightSetsCreated = 0;

    // Pre-compute calorie index for budget-aware selection
    const calorieIndex = buildCalorieIndex(parsedCache);

    // Assign calorie tiers to each day
    const dayTiers = assignDayTiers(selectedDays.length);
    console.log(`Calorie tier distribution: green=${dayTiers.filter(t => t === 'green').length}, amber=${dayTiers.filter(t => t === 'amber').length}, red=${dayTiers.filter(t => t === 'red').length}`);

    // Generate data for each day
    for (let i = 0; i < selectedDays.length; i++) {
      const day = selectedDays[i];
      const dateStr = formatDate(day);

      // Generate food entries using budget-aware selection
      if (generateFood) {
        const tier = dayTiers[i];
        const tierConfig = CALORIE_TIERS[tier];
        const dailyBudget = randomInt(tierConfig.min, tierConfig.max);

        // Track meals selected for this day
        const dayMeals: Array<{ rawInput: string; parsedItems: ParsedFoodItem[] }> = [];
        let runningCalories = 0;

        // 1. Pick breakfast (random)
        const breakfastInputs = DEMO_FOOD_INPUTS.breakfast.filter(inp => parsedCache.has(inp) && (parsedCache.get(inp)?.length || 0) > 0);
        if (breakfastInputs.length > 0) {
          const bInput = randomChoice(breakfastInputs);
          const bItems = parsedCache.get(bInput)!;
          dayMeals.push({ rawInput: bInput, parsedItems: bItems });
          runningCalories += calorieIndex.get(bInput) || 0;
        }

        // 2. Pick lunch (random)
        const lunchInputs = DEMO_FOOD_INPUTS.lunch.filter(inp => parsedCache.has(inp) && (parsedCache.get(inp)?.length || 0) > 0);
        if (lunchInputs.length > 0) {
          const lInput = randomChoice(lunchInputs);
          const lItems = parsedCache.get(lInput)!;
          dayMeals.push({ rawInput: lInput, parsedItems: lItems });
          runningCalories += calorieIndex.get(lInput) || 0;
        }

        // 3. Pick dinner — choose the one that brings total closest to budget
        const dinnerInputs = DEMO_FOOD_INPUTS.dinner.filter(inp => parsedCache.has(inp) && (parsedCache.get(inp)?.length || 0) > 0);
        if (dinnerInputs.length > 0) {
          const dInput = pickClosestMeal(dinnerInputs, calorieIndex, runningCalories, dailyBudget);
          const dItems = parsedCache.get(dInput)!;
          dayMeals.push({ rawInput: dInput, parsedItems: dItems });
          runningCalories += calorieIndex.get(dInput) || 0;
        }

        // 4. Optionally add snack to nudge toward budget
        const snackInputs = DEMO_FOOD_INPUTS.snack.filter(inp => parsedCache.has(inp) && (parsedCache.get(inp)?.length || 0) > 0);
        if (snackInputs.length > 0) {
          const calorieGap = dailyBudget - runningCalories;
          // Add snack if we're more than 200 cal under budget
          if (calorieGap > 200) {
            const sInput = pickClosestMeal(snackInputs, calorieIndex, runningCalories, dailyBudget);
            const sItems = parsedCache.get(sInput)!;
            dayMeals.push({ rawInput: sInput, parsedItems: sItems });
            runningCalories += calorieIndex.get(sInput) || 0;
          }
          // If still under by >150, add a second snack
          const remainingGap = dailyBudget - runningCalories;
          if (remainingGap > 150 && snackInputs.length > 1) {
            const usedSnacks = dayMeals.filter(m => DEMO_FOOD_INPUTS.snack.includes(m.rawInput)).map(m => m.rawInput);
            const availableSnacks = snackInputs.filter(s => !usedSnacks.includes(s));
            if (availableSnacks.length > 0) {
              const s2Input = pickClosestMeal(availableSnacks, calorieIndex, runningCalories, dailyBudget);
              const s2Items = parsedCache.get(s2Input)!;
              dayMeals.push({ rawInput: s2Input, parsedItems: s2Items });
            }
          }
        }

        // Insert all meals for this day
        for (const meal of dayMeals) {
          const totalCalories = meal.parsedItems.reduce((sum, item) => sum + (item.calories || 0), 0);
          const totalProtein = meal.parsedItems.reduce((sum, item) => sum + (item.protein || 0), 0);
          const totalCarbs = meal.parsedItems.reduce((sum, item) => sum + (item.carbs || 0), 0);
          const totalFat = meal.parsedItems.reduce((sum, item) => sum + (item.fat || 0), 0);

          const { error: foodError } = await serviceClient
            .from('food_entries')
            .insert({
              user_id: demoUserId,
              eaten_date: dateStr,
              raw_input: meal.rawInput,
              food_items: meal.parsedItems.map(item => ({
                uid: crypto.randomUUID(),
                description: item.name,
                portion: item.portion,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fiber: item.fiber,
                sugar: item.sugar,
                fat: item.fat,
                saturated_fat: item.saturated_fat,
                sodium: item.sodium,
                cholesterol: item.cholesterol,
                confidence: item.confidence,
              })),
              total_calories: totalCalories,
              total_protein: totalProtein,
              total_carbs: totalCarbs,
              total_fat: totalFat,
            });

          if (foodError) {
            console.error('Error inserting food entry:', foodError);
          } else {
            foodEntriesCreated++;
          }
        }
      }

      // Generate weight entries (roughly every other day)
      if (generateWeights && Math.random() < 0.5) {
        const { rawInput, exercises } = generateWeightEntriesForDay(
          weightConfig,
          i,
          selectedDays.length
        );
        
        const entryId = crypto.randomUUID();
        
        for (let j = 0; j < exercises.length; j++) {
          const exercise = exercises[j];
          const { error: weightError } = await serviceClient
            .from('weight_sets')
            .insert({
              user_id: demoUserId,
              entry_id: entryId,
              logged_date: dateStr,
              exercise_key: exercise.exercise_key,
              exercise_subtype: exercise.exercise_subtype ?? null,
              description: exercise.description,
              sets: exercise.sets,
              reps: exercise.reps,
              weight_lbs: exercise.weight_lbs,
              duration_minutes: exercise.duration_minutes ?? null,
              distance_miles: exercise.distance_miles ?? null,
              raw_input: j === 0 ? rawInput : null,
            });

          if (weightError) {
            console.error('Error inserting weight set:', weightError);
          } else {
            weightSetsCreated++;
          }
        }
      }

      // Generate cardio entries (40% chance per day)
      if (generateWeights && Math.random() < 0.4) {
        const cardioCount = Math.random() < 0.3 ? 2 : 1; // 30% chance of 2 cardio exercises
        const usedCardioKeys = new Set<string>();

        for (let c = 0; c < cardioCount; c++) {
          // Avoid duplicating the same activity
          const available = CARDIO_EXERCISES.filter(a => !usedCardioKeys.has(`${a.key}_${a.subtype}`));
          if (available.length === 0) break;

          const activity = randomChoice(available);
          usedCardioKeys.add(`${activity.key}_${activity.subtype}`);
          const entry = generateCardioEntry(activity);

          const cardioEntryId = crypto.randomUUID();
          const { error: cardioError } = await serviceClient
            .from('weight_sets')
            .insert({
              user_id: demoUserId,
              entry_id: cardioEntryId,
              logged_date: dateStr,
              exercise_key: entry.exercise_key,
              exercise_subtype: entry.exercise_subtype ?? null,
              description: entry.description,
              sets: 0,
              reps: 0,
              weight_lbs: 0,
              duration_minutes: entry.duration_minutes ?? null,
              distance_miles: entry.distance_miles ?? null,
              raw_input: entry.rawInput ?? null,
            });

          if (cardioError) {
            console.error('Error inserting cardio entry:', cardioError);
          } else {
            weightSetsCreated++;
          }
        }
      }

      // Generate casual activity (12% chance per day)
      if (generateWeights && Math.random() < 0.12) {
        const activity = randomChoice(CASUAL_ACTIVITIES);
        const entry = generateCardioEntry(activity);

        const casualEntryId = crypto.randomUUID();
        const { error: casualError } = await serviceClient
          .from('weight_sets')
          .insert({
            user_id: demoUserId,
            entry_id: casualEntryId,
            logged_date: dateStr,
            exercise_key: entry.exercise_key,
            exercise_subtype: entry.exercise_subtype ?? null,
            description: entry.description,
            sets: 0,
            reps: 0,
            weight_lbs: 0,
            duration_minutes: entry.duration_minutes ?? null,
            distance_miles: entry.distance_miles ?? null,
            raw_input: entry.rawInput ?? null,
          });

        if (casualError) {
          console.error('Error inserting casual activity:', casualError);
        } else {
          weightSetsCreated++;
        }
      }
    }

    // Generate saved meals with AI-parsed items
    let savedMealsCreated = 0;
    if (savedMealsCount > 0) {
      const savedMeals = generateSavedMeals(savedMealsCount, parsedCache);
      
      for (const meal of savedMeals) {
        const { error: mealError } = await serviceClient
          .from('saved_meals')
          .insert({
            user_id: demoUserId,
            name: meal.name,
            original_input: meal.original_input,
            food_items: meal.food_items,
            use_count: meal.use_count,
            last_used_at: new Date(Date.now() - randomInt(1, 14) * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (mealError) {
          console.error('Error inserting saved meal:', mealError);
        } else {
          savedMealsCreated++;
        }
      }
    }

    // Generate saved routines
    let savedRoutinesCreated = 0;
    if (savedRoutinesCount > 0) {
      const savedRoutines = generateSavedRoutines(savedRoutinesCount);
      
      for (const routine of savedRoutines) {
        const { error: routineError } = await serviceClient
          .from('saved_routines')
          .insert({
            user_id: demoUserId,
            name: routine.name,
            original_input: routine.original_input,
            exercise_sets: routine.exercise_sets,
            use_count: routine.use_count,
            last_used_at: new Date(Date.now() - randomInt(1, 14) * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (routineError) {
          console.error('Error inserting saved routine:', routineError);
        } else {
          savedRoutinesCreated++;
        }
      }
    }

    // Generate custom log entries (weight, blood pressure, body measurements)
    let customLogEntriesCreated = 0;

    function generateWanderingSeries(
      startVal: number, endVal: number, totalDays: number,
      intervalMin: number, intervalMax: number, stepSize: number, decimals: number,
    ): Array<{ day: number; value: number }> {
      const results: Array<{ day: number; value: number }> = [];
      let current = startVal;
      let day = 0;
      while (day < totalDays) {
        const progress = day / totalDays;
        const target = startVal + (endVal - startVal) * progress;
        const drift = (target - current) * 0.3;
        const noise = (Math.random() - 0.5) * stepSize;
        current += drift + noise;
        const factor = Math.pow(10, decimals);
        const rounded = Math.round(current * factor) / factor;
        results.push({ day, value: rounded });
        day += randomInt(intervalMin, intervalMax);
      }
      return results;
    }

    if (generateCustomLogs) {
      console.log('Generating custom log entries (weight, blood pressure, body measurements)...');

      // Clear existing custom log data for demo user
      const { error: clearEntriesErr } = await serviceClient
        .from('custom_log_entries')
        .delete()
        .eq('user_id', demoUserId);
      if (clearEntriesErr) console.error('Error clearing custom log entries:', clearEntriesErr);

      const { error: clearTypesErr } = await serviceClient
        .from('custom_log_types')
        .delete()
        .eq('user_id', demoUserId);
      if (clearTypesErr) console.error('Error clearing custom log types:', clearTypesErr);

      const totalDaysRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // --- 1. Weight (numeric, lbs) ---
      const { data: weightType, error: weightTypeErr } = await serviceClient
        .from('custom_log_types')
        .insert({ user_id: demoUserId, name: 'Weight', value_type: 'numeric', unit: 'lbs', sort_order: 0 })
        .select().single();

      if (weightTypeErr || !weightType) {
        console.error('Error creating Weight log type:', weightTypeErr);
      } else {
        const series = generateWanderingSeries(175, 165, totalDaysRange, 3, 4, 2.0, 1);
        const entries = series.map(s => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + s.day);
          return { user_id: demoUserId, log_type_id: weightType.id, logged_date: formatDate(d), numeric_value: s.value, unit: 'lbs' };
        });
        const { error } = await serviceClient.from('custom_log_entries').insert(entries);
        if (error) console.error('Error inserting weight entries:', error);
        else customLogEntriesCreated += entries.length;
      }

      // --- 2. Blood Pressure (dual_numeric, mmHg) ---
      const { data: bpType, error: bpTypeErr } = await serviceClient
        .from('custom_log_types')
        .insert({ user_id: demoUserId, name: 'Blood Pressure', value_type: 'dual_numeric', unit: 'mmHg', sort_order: 1 })
        .select().single();

      if (bpTypeErr || !bpType) {
        console.error('Error creating Blood Pressure log type:', bpTypeErr);
      } else {
        const systolicSeries = generateWanderingSeries(135, 122, totalDaysRange, 4, 5, 4.0, 0);
        const diastolicSeries = generateWanderingSeries(88, 78, totalDaysRange, 4, 5, 3.0, 0);
        // Use systolic series for day offsets, generate matching diastolic values
        const entries = systolicSeries.map((s, i) => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + s.day);
          const diastolic = i < diastolicSeries.length ? diastolicSeries[i].value : 78;
          return { user_id: demoUserId, log_type_id: bpType.id, logged_date: formatDate(d), numeric_value: s.value, numeric_value_2: diastolic, unit: 'mmHg' };
        });
        const { error } = await serviceClient.from('custom_log_entries').insert(entries);
        if (error) console.error('Error inserting blood pressure entries:', error);
        else customLogEntriesCreated += entries.length;
      }

      // --- 3. Body Measurements (text_numeric, in) - Waist + Chest ---
      const { data: bodyType, error: bodyTypeErr } = await serviceClient
        .from('custom_log_types')
        .insert({ user_id: demoUserId, name: 'Body Measurements', value_type: 'text_numeric', unit: 'in', sort_order: 2 })
        .select().single();

      if (bodyTypeErr || !bodyType) {
        console.error('Error creating Body Measurements log type:', bodyTypeErr);
      } else {
        // Waist entries
        const waistSeries = generateWanderingSeries(36.0, 33.5, totalDaysRange, 7, 10, 0.5, 1);
        const waistEntries = waistSeries.map(s => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + s.day);
          return { user_id: demoUserId, log_type_id: bodyType.id, logged_date: formatDate(d), text_value: 'Waist', numeric_value: s.value, unit: 'in' };
        });

        // Chest entries
        const chestSeries = generateWanderingSeries(42.0, 40.5, totalDaysRange, 7, 10, 0.4, 1);
        const chestEntries = chestSeries.map(s => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + s.day);
          return { user_id: demoUserId, log_type_id: bodyType.id, logged_date: formatDate(d), text_value: 'Chest', numeric_value: s.value, unit: 'in' };
        });

        const allBodyEntries = [...waistEntries, ...chestEntries];
        const { error } = await serviceClient.from('custom_log_entries').insert(allBodyEntries);
        if (error) console.error('Error inserting body measurement entries:', error);
        else customLogEntriesCreated += allBodyEntries.length;
      }

      // Enable showCustomLogs in demo user's profile settings
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('settings')
        .eq('id', demoUserId)
        .single();

      const currentSettings = (profile?.settings as Record<string, unknown>) || {};
      const updatedSettings = { ...currentSettings, showCustomLogs: true };

      const { error: settingsErr } = await serviceClient
        .from('profiles')
        .update({ settings: updatedSettings })
        .eq('id', demoUserId);

      if (settingsErr) {
        console.error('Error updating profile settings:', settingsErr);
      } else {
        console.log('Enabled showCustomLogs for demo user');
      }
    }

    const summary = {
      daysPopulated: selectedDays.length,
      foodEntries: foodEntriesCreated,
      weightSets: weightSetsCreated,
      savedMeals: savedMealsCreated,
      savedRoutines: savedRoutinesCreated,
      customLogEntries: customLogEntriesCreated,
      parsedInputs: parsedCache.size,
      dateRange: {
        start: formatDate(startDate),
        end: formatDate(endDate),
      },
    };

    console.log('Population complete:', summary);
  } catch (error) {
    console.error('Error in background population work:', error);
  }
}

// Handle shutdown gracefully
addEventListener('beforeunload', (ev) => {
  // deno-lint-ignore no-explicit-any
  console.log('Function shutdown:', (ev as any).detail?.reason || 'unknown reason');
});

// ============================================================================
// MAIN HANDLER
// ============================================================================

interface RequestParams {
  startDate?: string;
  endDate?: string;
  daysToPopulate?: number;
  generateFood?: boolean;
  generateWeights?: boolean;
  generateCustomLogs?: boolean;
  generateSavedMeals?: number;
  generateSavedRoutines?: number;
  clearExisting?: boolean;
  weights?: Partial<WeightConfig>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Check admin role
    const { data: isAdmin, error: roleError } = await authClient.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });

    if (roleError || !isAdmin) {
      console.error('Admin check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get demo user
    const { data: authData } = await serviceClient.auth.admin.listUsers();
    const demoAuthUser = authData?.users?.find(u => u.email === DEMO_EMAIL);
    
    if (!demoAuthUser) {
      return new Response(
        JSON.stringify({ error: 'Demo user not found in auth' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const demoUserId = demoAuthUser.id;
    console.log('Found demo user:', demoUserId);

    // Parse request parameters
    let params: RequestParams = {};
    try {
      const body = await req.text();
      if (body) {
        params = JSON.parse(body);
      }
    } catch {
      // Empty body is fine, use defaults
    }

    // Apply defaults - extend 30 days into the future
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);
    
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const startDate = params.startDate ? new Date(params.startDate) : ninetyDaysAgo;
    const endDate = params.endDate ? new Date(params.endDate) : thirtyDaysFromNow;
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysToPopulate = params.daysToPopulate ?? totalDays;
    const generateFood = params.generateFood ?? true;
    const generateWeights = params.generateWeights ?? true;
    const generateCustomLogs = params.generateCustomLogs ?? false;
    const savedMealsCount = params.generateSavedMeals ?? 5;
    const savedRoutinesCount = params.generateSavedRoutines ?? 4;
    const clearExisting = params.clearExisting ?? false;

    const weightConfig: WeightConfig = { ...DEFAULT_WEIGHT_CONFIG, ...params.weights };

    console.log('Parameters:', {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      daysToPopulate,
      generateFood,
      generateWeights,
      generateCustomLogs,
      savedMealsCount,
      savedRoutinesCount,
      clearExisting,
    });

    // Prepare params for background work
    const populationParams: PopulationParams = {
      startDate,
      endDate,
      daysToPopulate,
      generateFood,
      generateWeights,
      generateCustomLogs,
      savedMealsCount,
      savedRoutinesCount,
      clearExisting,
      weightConfig,
    };

    // Start background work using EdgeRuntime.waitUntil
    EdgeRuntime.waitUntil(doPopulationWork(populationParams, demoUserId, serviceClient));

    // Return immediately with processing status
    return new Response(
      JSON.stringify({
        success: true,
        status: 'processing',
        message: 'Population started. Check demo account in 1-2 minutes.',
        estimatedTime: '1-2 minutes',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in populate-demo-data:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
