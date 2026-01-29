

## Parameterized Demo Data Population Edge Function

### Overview

Create a flexible, reusable edge function that generates realistic demo data based on configurable parameters. This enables easy re-runs for testing different scenarios, populating new demo accounts, or refreshing existing data.

---

### API Design

```text
POST /populate-demo-data
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  // Date range
  "startDate": "2024-11-01",
  "endDate": "2025-01-29",
  "daysToPopulate": 60,
  
  // What to generate
  "generateFood": true,
  "generateWeights": true,
  "generateSavedMeals": 5,
  "generateSavedRoutines": 4,
  
  // Clear existing data first?
  "clearExisting": false,
  
  // Food configuration
  "food": {
    "barcodeScanPercent": 15,
    "shorthandPercent": 40,
    "casualWithTyposPercent": 20,
    "recipeLinksPercent": 5,
    "brandNamesPercent": 20
  },
  
  // Weight configuration  
  "weights": {
    "machinePercent": 40,
    "compoundPercent": 30,
    "freeWeightPercent": 30,
    "progressionMultiplier": 1.0  // 0.5 = slower gains, 2.0 = faster gains
  }
}
```

**All parameters optional** - function uses sensible defaults if omitted.

---

### Built-in Data Sets

The function will contain curated arrays of realistic inputs:

**Recipe URLs (variety of cuisines and complexity)**

```typescript
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
```

**Brand Names (mainstream, recognizable)**

```typescript
const BRANDS = {
  protein: ['Quest', 'Kirkland', 'RXBAR', 'Built Bar', 'ONE Bar'],
  yogurt: ['Chobani', 'Fage', 'Siggi\'s', 'Oikos'],
  frozen: ['Trader Joe\'s', 'Amy\'s', 'Lean Cuisine', 'Healthy Choice'],
  snacks: ['KIND', 'Clif', 'Nature Valley', 'LÄRABAR'],
  drinks: ['Starbucks', 'Dunkin\'', 'Celsius', 'Liquid Death'],
  grocery: ['Costco', 'Whole Foods', 'Aldi', 'Wegmans'],
};
```

**Exercises by Category**

```typescript
const EXERCISES = {
  machine: [
    { key: 'lat_pulldown', name: 'Lat Pulldown', startWeight: 70, maxProgress: 25 },
    { key: 'chest_press_machine', name: 'Chest Press Machine', startWeight: 50, maxProgress: 30 },
    { key: 'leg_press', name: 'Leg Press', startWeight: 90, maxProgress: 90 },
    { key: 'leg_extension', name: 'Leg Extension', startWeight: 40, maxProgress: 30 },
    { key: 'leg_curl', name: 'Leg Curl', startWeight: 35, maxProgress: 25 },
    { key: 'cable_row', name: 'Cable Row', startWeight: 50, maxProgress: 25 },
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
```

---

### Input Variation Strategies

**Length Variation (always applied)**

```typescript
// Short: "eggs and toast"
// Medium: "2 eggs scrambled with cheese and buttered toast"  
// Long: "made scrambled eggs with cheddar cheese, 2 slices of sourdough toast with butter and a glass of OJ"
```

**Typo Generation**

```typescript
const COMMON_TYPOS = {
  'chicken': ['chiken', 'chicekn'],
  'sandwich': ['sandwhich', 'sandwhich'],
  'breakfast': ['breakfest', 'brekfast'],
  'grilled': ['griled', 'grillled'],
  // ... more
};
```

**Recipe Link Modifications (25% of recipe entries)**

```typescript
// Base: "made this: https://..."
// Modified: "made this: https://... but without the nuts"
// Modified: "made this: https://... halved the recipe"
// Modified: "made this: https://... doubled it for meal prep"
```

---

### Progression Algorithm

```typescript
function calculateWeight(
  baseWeight: number,
  maxProgress: number,
  dayIndex: number,      // 0 = earliest day, N = latest day
  totalDays: number,     // Total days with workouts
  progressionMultiplier: number = 1.0
): number {
  // Linear progression with some random variation
  const progress = (dayIndex / totalDays) * maxProgress * progressionMultiplier;
  const variance = (Math.random() - 0.5) * 5; // ±2.5 lbs random variance
  return Math.round((baseWeight + progress + variance) / 5) * 5; // Round to nearest 5
}

function calculateSetsReps(dayIndex: number, totalDays: number): { sets: number, reps: number } {
  // Start: 3 sets × 8 reps
  // End: 4 sets × 10-12 reps
  const progress = dayIndex / totalDays;
  return {
    sets: progress > 0.5 ? 4 : 3,
    reps: Math.min(12, 8 + Math.floor(progress * 4)),
  };
}
```

---

### Security Architecture

```text
POST /populate-demo-data
├── Extract JWT from Authorization header
├── Validate token via getClaims()
├── Verify admin role via has_role RPC
├── Validate demo user exists (email = DEMO_EMAIL)
├── Parse and validate request parameters
├── Optionally clear existing data (if clearExisting: true)
│   ├── Delete food_entries in date range for demo user
│   ├── Delete weight_sets in date range for demo user
│   └── Optionally delete saved_meals/routines
├── Generate random days within date range
├── For each day:
│   ├── Generate food entries (if enabled)
│   └── Generate weight entries (if enabled)
├── Generate saved meals (if count > 0)
├── Generate saved routines (if count > 0)
└── Return summary of created data
```

**Service Role Usage**

The function uses the service role key to bypass RLS when inserting data for the demo user. This is safe because:
1. Only admins can call the function
2. Target user is always the hardcoded demo email
3. All data is realistic demo content

---

### Response Format

```typescript
{
  success: true,
  summary: {
    daysPopulated: 60,
    foodEntries: 240,      // ~4 per day
    weightSets: 300,       // ~5 per workout day
    savedMeals: 5,
    savedRoutines: 4,
    dateRange: {
      start: "2024-11-01",
      end: "2025-01-29"
    }
  }
}
```

---

### Default Values

When parameters are omitted, use these defaults:

| Parameter | Default Value |
|-----------|---------------|
| startDate | 90 days ago |
| endDate | today |
| daysToPopulate | 60 |
| generateFood | true |
| generateWeights | true |
| generateSavedMeals | 5 |
| generateSavedRoutines | 4 |
| clearExisting | false |
| food.barcodeScanPercent | 15 |
| food.shorthandPercent | 40 |
| food.casualWithTyposPercent | 20 |
| food.recipeLinksPercent | 5 |
| food.brandNamesPercent | 20 |
| weights.machinePercent | 40 |
| weights.compoundPercent | 30 |
| weights.freeWeightPercent | 30 |
| weights.progressionMultiplier | 1.0 |

---

### Files Changed

| Location | Change |
|----------|--------|
| `supabase/functions/populate-demo-data/index.ts` | New parameterized edge function |
| `supabase/config.toml` | Add function config with `verify_jwt = false` |

---

### Example Usage

**Initial population with defaults**
```bash
curl -X POST https://[project].supabase.co/functions/v1/populate-demo-data \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Refresh last 30 days only**
```bash
curl -X POST ... \
  -d '{
    "startDate": "2025-01-01",
    "endDate": "2025-01-29",
    "daysToPopulate": 25,
    "clearExisting": true
  }'
```

**Weights only with faster progression**
```bash
curl -X POST ... \
  -d '{
    "generateFood": false,
    "generateSavedMeals": 0,
    "weights": {
      "progressionMultiplier": 1.5,
      "compoundPercent": 50
    }
  }'
```

