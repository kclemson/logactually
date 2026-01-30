
## Add Fiber and Net Carbs to Food Data Model

### Overview

Add `fiber` and `net_carbs` fields to the food analysis pipeline, storing them in the JSONB `food_items` column. Since the data is stored as JSONB, no database schema migration is needed - the new fields will simply be included in the JSON objects going forward. Older entries without these fields will continue to work (they'll just be undefined/0).

---

### Data Flow Changes

```text
User Input
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ analyze-food Edge Function                          │
│  • Update prompt to request fiber                   │
│  • Parse fiber from AI response                     │
│  • Calculate net_carbs = carbs - fiber              │
│  • Return both in response                          │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ useAnalyzeFood Hook                                 │
│  • Add fiber, net_carbs to AnalyzeResult            │
│  • Pass through to FoodItem objects                 │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ food_entries.food_items (JSONB)                     │
│  • No schema change needed                          │
│  • New fields stored automatically                  │
└─────────────────────────────────────────────────────┘
```

---

### File Changes

#### 1. AI Prompt (`supabase/functions/_shared/prompts.ts`)

Add `fiber` to the JSON schema in both prompt versions:

```diff
 For each food item, provide:
 - name: a SHORT, concise name (max 25 characters)...
 - carbs: grams of carbohydrates (whole number)
+- fiber: grams of dietary fiber (whole number)
 - fat: grams of fat (whole number)
```

Update the example JSON output:
```diff
-{ "name": "Food name", "portion": "portion size", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "confidence": "high" }
+{ "name": "Food name", "portion": "portion size", "calories": 0, "protein": 0, "carbs": 0, "fiber": 0, "fat": 0, "confidence": "high" }
```

---

#### 2. Edge Function (`supabase/functions/analyze-food/index.ts`)

Update interfaces to include fiber:

```typescript
interface ParsedFoodItem {
  // ... existing fields
  fiber: number;
}

interface FoodItem {
  // ... existing fields
  fiber: number;
  net_carbs: number;  // Calculated: carbs - fiber
}
```

Update the mapping logic:

```typescript
const mergedItems: FoodItem[] = parsed.food_items.map(item => ({
  // ... existing fields
  fiber: item.fiber || 0,
  net_carbs: Math.max(0, (item.carbs || 0) - (item.fiber || 0)),
}));
```

Add fiber totals to response:

```typescript
interface AnalyzeResponse {
  // ... existing fields
  total_fiber: number;
  total_net_carbs: number;
}

// In totals calculation:
const totals = mergedItems.reduce(
  (acc, item) => ({
    // ... existing fields
    fiber: acc.fiber + item.fiber,
  }),
  { calories: 0, protein: 0, carbs: 0, fiber: 0, fat: 0 }
);

// Add to result:
total_fiber: Math.round(totals.fiber),
total_net_carbs: Math.round(totals.carbs - totals.fiber),
```

---

#### 3. TypeScript Types (`src/types/food.ts`)

```typescript
export interface FoodItem {
  // ... existing fields
  fiber?: number;      // Optional for backwards compat with existing data
  net_carbs?: number;  // Calculated: carbs - fiber
}

export interface FoodEntry {
  // ... existing fields
  // Note: no schema change - fiber stored inside food_items JSONB
}
```

Update `calculateTotals` to include fiber:

```typescript
export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  fat: number;
}

export function calculateTotals(items: FoodItem[]): DailyTotals {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fiber: acc.fiber + (item.fiber || 0),
      fat: acc.fat + (item.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fiber: 0, fat: 0 }
  );
}
```

---

#### 4. Analyze Hook (`src/hooks/useAnalyzeFood.ts`)

Update the result interface:

```typescript
interface AnalyzeResult {
  food_items: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fiber: number;
  total_net_carbs: number;
  total_fat: number;
}
```

---

#### 5. Food Entries Hook (`src/hooks/useFoodEntries.ts`)

Update the mapping to preserve fiber when reading from DB:

```typescript
const itemsWithIds: FoodItem[] = rawItems.map((item) => ({
  // ... existing fields
  fiber: item.fiber || 0,
  net_carbs: item.net_carbs || Math.max(0, (item.carbs || 0) - (item.fiber || 0)),
}));
```

---

#### 6. Saved Meals Hook (`src/hooks/useSavedMeals.ts`)

No changes needed - fiber will flow through automatically since it's part of FoodItem and stored as JSONB.

---

#### 7. CSV Export (`src/lib/csv-export.ts`)

Add fiber column to exports (future-ready):

```typescript
// exportFoodLog headers:
const headers = ['Date', 'Time', 'Food Item', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fiber (g)', 'Fat (g)', 'Raw Input'];

// Row mapping:
rows.push([
  // ... existing fields
  item.fiber || 0,  // Add after carbs
  // ... rest
]);
```

---

### What Stays Hidden (No UI Changes)

These components will continue to work as-is, silently ignoring fiber:
- `FoodItemsTable.tsx` - displays P/C/F only
- `MacroSummary.tsx` - shows totals without fiber
- History/Trends pages - aggregate existing fields

The fiber data will be logged to the database for future use when you decide to surface it in the UI.

---

### Backwards Compatibility

| Scenario | Behavior |
|----------|----------|
| Old entries (no fiber) | `fiber` defaults to `0` when read |
| New entries | Include AI-estimated fiber value |
| Saved meals | Fiber included when meal is saved |
| Re-logged saved meals | Fiber preserved from original |

---

### Summary

| Component | Change Type |
|-----------|-------------|
| `_shared/prompts.ts` | Add fiber to AI prompt |
| `analyze-food/index.ts` | Parse fiber, calculate net_carbs |
| `src/types/food.ts` | Add optional fiber/net_carbs fields |
| `src/hooks/useAnalyzeFood.ts` | Update result interface |
| `src/hooks/useFoodEntries.ts` | Map fiber when reading entries |
| `src/lib/csv-export.ts` | Include fiber in exports |
| **Database** | No migration needed (JSONB) |
