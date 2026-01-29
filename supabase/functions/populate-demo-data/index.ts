import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// CONSTANTS AND DATA SETS
// ============================================================================

const DEMO_EMAIL = 'demo@logactually.com';

// Recipe URLs with optional ingredient modifications
const RECIPE_URLS = [
  { url: 'https://www.bonappetit.com/recipe/cacio-e-pepe', name: 'Cacio e Pepe', optionalIngredients: ['pecorino', 'extra pepper'] },
  { url: 'https://www.seriouseats.com/the-best-slow-cooked-bolognese-sauce-recipe', name: 'Bolognese', optionalIngredients: ['wine', 'milk'] },
  { url: 'https://cooking.nytimes.com/recipes/1015819-chocolate-chip-cookies', name: 'Chocolate Chip Cookies', optionalIngredients: ['nuts', 'chocolate chips'] },
  { url: 'https://www.allrecipes.com/recipe/23600/worlds-best-lasagna/', name: 'Lasagna', optionalIngredients: ['ricotta', 'italian sausage'] },
  { url: 'https://minimalistbaker.com/easy-pad-thai/', name: 'Pad Thai', optionalIngredients: ['peanuts', 'tofu'] },
  { url: 'https://www.budgetbytes.com/one-pot-chicken-and-rice/', name: 'Chicken and Rice', optionalIngredients: ['peas', 'carrots'] },
  { url: 'https://www.simplyrecipes.com/recipes/homemade_pizza/', name: 'Homemade Pizza', optionalIngredients: ['pepperoni', 'olives'] },
  { url: 'https://natashaskitchen.com/banana-bread-recipe-video/', name: 'Banana Bread', optionalIngredients: ['walnuts', 'chocolate chips'] },
];

// Brand names by category
const BRANDS = {
  protein: ['Quest', 'Kirkland', 'RXBAR', 'Built Bar', 'ONE Bar'],
  yogurt: ['Chobani', 'Fage', "Siggi's", 'Oikos'],
  frozen: ["Trader Joe's", "Amy's", 'Lean Cuisine', 'Healthy Choice'],
  snacks: ['KIND', 'Clif', 'Nature Valley', 'LÄRABAR'],
  drinks: ['Starbucks', "Dunkin'", 'Celsius', 'Liquid Death'],
  grocery: ['Costco', 'Whole Foods', 'Aldi', 'Wegmans'],
};

// Brand-specific food items
const BRAND_FOODS = [
  { brand: 'Quest', items: ['protein bar cookies and cream', 'protein bar chocolate chip cookie dough', 'protein chips nacho cheese'] },
  { brand: 'Kirkland', items: ['protein bar', 'greek yogurt', 'rotisserie chicken'] },
  { brand: 'Chobani', items: ['greek yogurt vanilla', 'greek yogurt strawberry', 'flip yogurt'] },
  { brand: 'Fage', items: ['total 0% greek yogurt', 'total 2% greek yogurt with honey'] },
  { brand: "Trader Joe's", items: ['mandarin orange chicken', 'cauliflower gnocchi', 'everything but the bagel seasoning salmon'] },
  { brand: 'Starbucks', items: ['grande oat milk latte', 'venti iced coffee', 'grande cold brew with cream'] },
  { brand: "Dunkin'", items: ['medium iced coffee with oat milk', 'bacon egg cheese on english muffin'] },
  { brand: 'Costco', items: ['rotisserie chicken (1/4)', 'chicken bake', 'acai bowl'] },
  { brand: 'KIND', items: ['dark chocolate nuts & sea salt bar', 'peanut butter dark chocolate bar'] },
  { brand: 'Clif', items: ['chocolate chip bar', 'crunchy peanut butter bar'] },
];

// Common typos for realistic input
const COMMON_TYPOS: Record<string, string[]> = {
  'chicken': ['chiken', 'chicekn'],
  'sandwich': ['sandwhich', 'sandwitch'],
  'breakfast': ['breakfest', 'brekfast'],
  'grilled': ['griled', 'grillled'],
  'scrambled': ['scrambeld', 'scambled'],
  'burrito': ['burito', 'buritto'],
  'oatmeal': ['oatmal', 'oatmeel'],
  'avocado': ['avacado', 'avocodo'],
  'broccoli': ['brocoli', 'brocolli'],
  'restaurant': ['restaraunt', 'resturant'],
};

// Shorthand food entries (casual, brief)
const SHORTHAND_FOODS = {
  breakfast: [
    'eggs and toast',
    '2 eggs scrambled',
    'oatmeal with banana',
    'cereal with milk',
    'yogurt and granola',
    'bagel with cream cheese',
    'avocado toast',
    'protein shake',
    'overnight oats',
    'english muffin with pb',
  ],
  lunch: [
    'turkey sandwich',
    'salad with chicken',
    'leftover pasta',
    'soup and bread',
    'burrito bowl',
    'sushi (8 pieces)',
    'grilled cheese',
    'chicken wrap',
    'poke bowl',
    'mediterranean bowl',
  ],
  dinner: [
    'salmon and veggies',
    'chicken stir fry',
    'pasta with meat sauce',
    'tacos (3)',
    'pizza (2 slices)',
    'burger and fries',
    'grilled chicken and rice',
    'shrimp scampi',
    'beef and broccoli',
    'baked chicken thighs',
  ],
  snack: [
    'apple with peanut butter',
    'handful of almonds',
    'protein bar',
    'banana',
    'greek yogurt',
    'cheese stick',
    'carrots and hummus',
    'trail mix',
    'popcorn',
    'rice cakes',
  ],
};

// Casual entries with potential typos
const CASUAL_FOODS = {
  breakfast: [
    'made scrambled eggs with cheddar cheese and some toast',
    'had a big bowl of oatmeal with blueberries and honey',
    'grabbed a breakfast sandwich from the cafe',
    'just coffee and a banana this morning',
    'smoothie with spinach, banana, protein powder',
    'french toast with maple syrup (2 pieces)',
    'breakfast burrito with eggs, cheese, and salsa',
  ],
  lunch: [
    'got chipotle - chicken bowl with guac',
    'ate leftover chicken stir fry from last night',
    'had a big salad with grilled chicken and ranch',
    'sandwich from the deli, turkey and swiss',
    'ramen from the place down the street',
    'meal prep chicken and rice',
    'panera bread bowl soup',
  ],
  dinner: [
    'cooked salmon in the air fryer with roasted veggies',
    'ordered thai food - pad thai and spring rolls',
    'homemade tacos with ground beef, like 3 of them',
    'grilled chicken breast with quinoa and asparagus',
    'spaghetti and meatballs, pretty big portion',
    'went out for sushi, had about 12 pieces plus miso soup',
    'made a big stir fry with tofu and vegetables',
  ],
  snack: [
    'needed something sweet so had some dark chocolate',
    'protein shake after workout',
    'handful of mixed nuts from the jar',
    'an apple and some peanut butter',
    'cheese and crackers',
    'leftover halloween candy (2 pieces)',
  ],
};

// Exercises by category
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

// Saved meal templates
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

// Saved routine templates
const SAVED_ROUTINE_TEMPLATES = [
  { name: 'Upper Body Day', exercises: ['bench_press', 'lat_pulldown', 'shoulder_press', 'bicep_curl', 'seated_row'] },
  { name: 'Leg Day', exercises: ['squat', 'leg_press', 'leg_extension', 'leg_curl', 'calf_raise'] },
  { name: 'Full Body Quick', exercises: ['squat', 'bench_press', 'lat_pulldown', 'bicep_curl'] },
  { name: 'Push Day', exercises: ['bench_press', 'shoulder_press_machine', 'chest_press_machine', 'lateral_raise'] },
  { name: 'Pull Day', exercises: ['lat_pulldown', 'seated_row', 'bicep_curl', 'hammer_curl', 'dumbbell_row'] },
  { name: 'Machine Circuit', exercises: ['chest_press_machine', 'lat_pulldown', 'leg_press', 'shoulder_press_machine'] },
];

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

function applyTypo(text: string): string {
  for (const [word, typos] of Object.entries(COMMON_TYPOS)) {
    if (text.toLowerCase().includes(word) && Math.random() < 0.3) {
      const regex = new RegExp(word, 'gi');
      return text.replace(regex, randomChoice(typos));
    }
  }
  return text;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================================================
// FOOD GENERATION
// ============================================================================

interface FoodConfig {
  barcodeScanPercent: number;
  shorthandPercent: number;
  casualWithTyposPercent: number;
  recipeLinksPercent: number;
  brandNamesPercent: number;
}

const DEFAULT_FOOD_CONFIG: FoodConfig = {
  barcodeScanPercent: 15,
  shorthandPercent: 40,
  casualWithTyposPercent: 20,
  recipeLinksPercent: 5,
  brandNamesPercent: 20,
};

// Common UPC codes that might be scanned
const BARCODE_SCANS = [
  { upc: '049000000443', description: 'Coca-Cola Classic' },
  { upc: '038000138416', description: 'Kellogg\'s Frosted Flakes' },
  { upc: '028400064057', description: 'Doritos Nacho Cheese' },
  { upc: '013000006408', description: 'Heinz Ketchup' },
  { upc: '041270003209', description: 'La Croix Sparkling Water' },
  { upc: '041196010176', description: 'Oikos Triple Zero Yogurt' },
  { upc: '818780010122', description: 'RXBar Chocolate Sea Salt' },
  { upc: '888849000562', description: 'Quest Protein Bar' },
];

function generateBarcodeEntry(): string {
  const scan = randomChoice(BARCODE_SCANS);
  return `Scanned: ${scan.upc}`;
}

function generateShorthandEntry(mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): string {
  return randomChoice(SHORTHAND_FOODS[mealType]);
}

function generateCasualEntry(mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): string {
  const entry = randomChoice(CASUAL_FOODS[mealType]);
  return Math.random() < 0.5 ? applyTypo(entry) : entry;
}

function generateRecipeEntry(): string {
  const recipe = randomChoice(RECIPE_URLS);
  let entry = `made this: ${recipe.url}`;
  
  // 25% chance to add a modification
  if (Math.random() < 0.25 && recipe.optionalIngredients.length > 0) {
    const modification = randomChoice([
      `but without the ${randomChoice(recipe.optionalIngredients)}`,
      'halved the recipe',
      'doubled it for meal prep',
      `added extra ${randomChoice(recipe.optionalIngredients)}`,
    ]);
    entry += ` ${modification}`;
  }
  
  return entry;
}

function generateBrandEntry(): string {
  const brandFood = randomChoice(BRAND_FOODS);
  const item = randomChoice(brandFood.items);
  return `${brandFood.brand} ${item}`;
}

function selectFoodEntryType(config: FoodConfig): 'barcode' | 'shorthand' | 'casual' | 'recipe' | 'brand' {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  cumulative += config.barcodeScanPercent;
  if (rand < cumulative) return 'barcode';
  
  cumulative += config.shorthandPercent;
  if (rand < cumulative) return 'shorthand';
  
  cumulative += config.casualWithTyposPercent;
  if (rand < cumulative) return 'casual';
  
  cumulative += config.recipeLinksPercent;
  if (rand < cumulative) return 'recipe';
  
  return 'brand';
}

function generateFoodEntriesForDay(config: FoodConfig): string[] {
  const entries: string[] = [];
  const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner'];
  
  // Maybe add a snack (60% chance)
  if (Math.random() < 0.6) {
    mealTypes.push('snack');
  }
  
  for (const mealType of mealTypes) {
    const entryType = selectFoodEntryType(config);
    
    switch (entryType) {
      case 'barcode':
        entries.push(generateBarcodeEntry());
        break;
      case 'shorthand':
        entries.push(generateShorthandEntry(mealType));
        break;
      case 'casual':
        entries.push(generateCasualEntry(mealType));
        break;
      case 'recipe':
        // Recipes usually for dinner
        if (mealType === 'dinner' || Math.random() < 0.3) {
          entries.push(generateRecipeEntry());
        } else {
          entries.push(generateShorthandEntry(mealType));
        }
        break;
      case 'brand':
        entries.push(generateBrandEntry());
        break;
    }
  }
  
  return entries;
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

interface ExerciseData {
  key: string;
  name: string;
  startWeight: number;
  maxProgress: number;
}

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
  description: string;
  sets: number;
  reps: number;
  weight_lbs: number;
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
    
    // Generate varied input format
    const format = randomChoice(['standard', 'casual', 'brief']);
    switch (format) {
      case 'standard':
        inputParts.push(`${exercise.name} ${sets}x${reps} @ ${weight}lbs`);
        break;
      case 'casual':
        inputParts.push(`${exercise.name.toLowerCase()} ${sets} sets of ${reps} at ${weight}`);
        break;
      case 'brief':
        inputParts.push(`${exercise.name} ${weight}lb ${sets}x${reps}`);
        break;
    }
  }
  
  // Combine into a single raw input with varied separators
  const separator = randomChoice([', ', '\n', ' | ', '; ']);
  const rawInput = inputParts.join(separator);
  
  return { rawInput, exercises };
}

// ============================================================================
// SAVED ITEMS GENERATION
// ============================================================================

function generateSavedMeals(count: number): Array<{ name: string; original_input: string; food_items: unknown[]; use_count: number }> {
  const templates = shuffleArray(SAVED_MEAL_TEMPLATES).slice(0, count);
  
  return templates.map(template => ({
    name: template.name,
    original_input: template.items.join(', '),
    food_items: template.items.map((item, idx) => ({
      uid: `saved-${Date.now()}-${idx}`,
      description: item,
      calories: randomInt(100, 500),
      protein: randomInt(5, 40),
      carbs: randomInt(10, 60),
      fat: randomInt(3, 25),
    })),
    use_count: randomInt(2, 10),
  }));
}

function generateSavedRoutines(count: number): Array<{ name: string; original_input: string; exercise_sets: unknown[]; use_count: number }> {
  const templates = shuffleArray(SAVED_ROUTINE_TEMPLATES).slice(0, count);
  
  return templates.map(template => {
    const exerciseSets = template.exercises.map(key => {
      // Find exercise data from all categories
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
// MAIN HANDLER
// ============================================================================

interface RequestParams {
  startDate?: string;
  endDate?: string;
  daysToPopulate?: number;
  generateFood?: boolean;
  generateWeights?: boolean;
  generateSavedMeals?: number;
  generateSavedRoutines?: number;
  clearExisting?: boolean;
  food?: Partial<FoodConfig>;
  weights?: Partial<WeightConfig>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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

    // Client for auth validation
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

    // Service role client for bypassing RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get demo user ID
    const { data: demoUsers, error: demoError } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('is_read_only', true);

    if (demoError || !demoUsers || demoUsers.length === 0) {
      // Try to find by looking up in auth.users (service role can access)
      const { data: authData } = await serviceClient.auth.admin.listUsers();
      const demoUser = authData?.users?.find(u => u.email === DEMO_EMAIL);
      
      if (!demoUser) {
        return new Response(
          JSON.stringify({ error: 'Demo user not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get demo user ID from auth
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

    // Apply defaults
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    const startDate = params.startDate ? new Date(params.startDate) : ninetyDaysAgo;
    const endDate = params.endDate ? new Date(params.endDate) : today;
    const daysToPopulate = params.daysToPopulate ?? 60;
    const generateFood = params.generateFood ?? true;
    const generateWeights = params.generateWeights ?? true;
    const savedMealsCount = params.generateSavedMeals ?? 5;
    const savedRoutinesCount = params.generateSavedRoutines ?? 4;
    const clearExisting = params.clearExisting ?? false;

    const foodConfig: FoodConfig = { ...DEFAULT_FOOD_CONFIG, ...params.food };
    const weightConfig: WeightConfig = { ...DEFAULT_WEIGHT_CONFIG, ...params.weights };

    console.log('Parameters:', {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      daysToPopulate,
      generateFood,
      generateWeights,
      savedMealsCount,
      savedRoutinesCount,
      clearExisting,
    });

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

    // Select random days within range
    const selectedDays = selectRandomDays(startDate, endDate, daysToPopulate);
    console.log(`Selected ${selectedDays.length} days to populate`);

    let foodEntriesCreated = 0;
    let weightSetsCreated = 0;

    // Generate data for each day
    for (let i = 0; i < selectedDays.length; i++) {
      const day = selectedDays[i];
      const dateStr = formatDate(day);

      // Generate food entries
      if (generateFood) {
        const foodInputs = generateFoodEntriesForDay(foodConfig);
        
        for (const rawInput of foodInputs) {
          const { error: foodError } = await serviceClient
            .from('food_entries')
            .insert({
              user_id: demoUserId,
              eaten_date: dateStr,
              raw_input: rawInput,
              food_items: [{
                uid: crypto.randomUUID(),
                description: rawInput,
                calories: randomInt(150, 700),
                protein: randomInt(5, 45),
                carbs: randomInt(10, 80),
                fat: randomInt(3, 35),
              }],
              total_calories: randomInt(150, 700),
              total_protein: randomInt(5, 45),
              total_carbs: randomInt(10, 80),
              total_fat: randomInt(3, 35),
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
              description: exercise.description,
              sets: exercise.sets,
              reps: exercise.reps,
              weight_lbs: exercise.weight_lbs,
              raw_input: j === 0 ? rawInput : null, // Only first exercise gets raw input
            });

          if (weightError) {
            console.error('Error inserting weight set:', weightError);
          } else {
            weightSetsCreated++;
          }
        }
      }
    }

    // Generate saved meals
    let savedMealsCreated = 0;
    if (savedMealsCount > 0) {
      const savedMeals = generateSavedMeals(savedMealsCount);
      
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

    const summary = {
      daysPopulated: selectedDays.length,
      foodEntries: foodEntriesCreated,
      weightSets: weightSetsCreated,
      savedMeals: savedMealsCreated,
      savedRoutines: savedRoutinesCreated,
      dateRange: {
        start: formatDate(startDate),
        end: formatDate(endDate),
      },
    };

    console.log('Population complete:', summary);

    return new Response(
      JSON.stringify({ success: true, summary }),
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
