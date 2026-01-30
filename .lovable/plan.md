
## Add Sodium, Sugar, Saturated Fat, and Cholesterol to Food Data Model

### Overview

Extend the food analysis pipeline to capture four additional nutritional fields: **sodium**, **sugar**, **saturated fat**, and **cholesterol**. Like fiber, these will be stored in the JSONB `food_items` column with no database migration required. The data will be logged for future use without any UI changes.

---

### New Fields

| Field | Unit | Notes |
|-------|------|-------|
| `sodium` | mg | High variance in processed foods, but well-documented |
| `sugar` | g | Subset of carbs; useful for tracking refined carb intake |
| `saturated_fat` | g | Subset of total fat; relevant for heart health |
| `cholesterol` | mg | Present in animal products; well-established values |

---

### File Changes

#### 1. AI Prompt (`supabase/functions/_shared/prompts.ts`)

Add the new fields to both prompt versions:

```diff
 For each food item, provide:
 - name: a SHORT, concise name (max 25 characters)...
 - carbs: grams of carbohydrates (whole number)
 - fiber: grams of dietary fiber (whole number)
+- sugar: grams of sugar (whole number)
 - fat: grams of fat (whole number)
+- saturated_fat: grams of saturated fat (whole number)
+- sodium: milligrams of sodium (whole number)
+- cholesterol: milligrams of cholesterol (whole number)
```

Update the example JSON in both prompts:
```json
{ "name": "Food name", "portion": "portion size", "calories": 0, "protein": 0, "carbs": 0, "fiber": 0, "sugar": 0, "fat": 0, "saturated_fat": 0, "sodium": 0, "cholesterol": 0, "confidence": "high", "source_note": "optional" }
```

---

#### 2. Edge Function (`supabase/functions/analyze-food/index.ts`)

Update interfaces:

```typescript
interface ParsedFoodItem {
  // ... existing fields
  sugar: number;
  saturated_fat: number;
  sodium: number;
  cholesterol: number;
}

interface FoodItem {
  // ... existing fields
  sugar: number;
  saturated_fat: number;
  sodium: number;
  cholesterol: number;
}

interface AnalyzeResponse {
  // ... existing fields
  total_sugar: number;
  total_saturated_fat: number;
  total_sodium: number;
  total_cholesterol: number;
}
```

Update the mapping logic to include the new fields:

```typescript
const mergedItems: FoodItem[] = parsed.food_items.map(item => ({
  // ... existing fields
  sugar: item.sugar || 0,
  saturated_fat: item.saturated_fat || 0,
  sodium: item.sodium || 0,
  cholesterol: item.cholesterol || 0,
}));
```

Update totals calculation:

```typescript
const totals = mergedItems.reduce(
  (acc, item) => ({
    // ... existing fields
    sugar: acc.sugar + item.sugar,
    saturated_fat: acc.saturated_fat + item.saturated_fat,
    sodium: acc.sodium + item.sodium,
    cholesterol: acc.cholesterol + item.cholesterol,
  }),
  { calories: 0, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 0, saturated_fat: 0, sodium: 0, cholesterol: 0 }
);
```

---

#### 3. TypeScript Types (`src/types/food.ts`)

Add optional fields to FoodItem:

```typescript
export interface FoodItem {
  // ... existing fields
  sugar?: number;           // Grams of sugar (optional for backwards compat)
  saturated_fat?: number;   // Grams of saturated fat
  sodium?: number;          // Milligrams of sodium
  cholesterol?: number;     // Milligrams of cholesterol
}
```

Update DailyTotals to include all new fields:

```typescript
export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  sugar: number;
  fat: number;
  saturated_fat: number;
  sodium: number;
  cholesterol: number;
}
```

Update `calculateTotals` function:

```typescript
export function calculateTotals(items: FoodItem[]): DailyTotals {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fiber: acc.fiber + (item.fiber || 0),
      sugar: acc.sugar + (item.sugar || 0),
      fat: acc.fat + (item.fat || 0),
      saturated_fat: acc.saturated_fat + (item.saturated_fat || 0),
      sodium: acc.sodium + (item.sodium || 0),
      cholesterol: acc.cholesterol + (item.cholesterol || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 0, saturated_fat: 0, sodium: 0, cholesterol: 0 }
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
  total_sugar: number;
  total_fat: number;
  total_saturated_fat: number;
  total_sodium: number;
  total_cholesterol: number;
}
```

---

#### 5. Food Entries Hook (`src/hooks/useFoodEntries.ts`)

Update the mapping to preserve new fields when reading from DB:

```typescript
const itemsWithIds: FoodItem[] = rawItems.map((item) => ({
  // ... existing fields
  sugar: item.sugar || 0,
  saturated_fat: item.saturated_fat || 0,
  sodium: item.sodium || 0,
  cholesterol: item.cholesterol || 0,
}));
```

---

#### 6. Export Data Hook (`src/hooks/useExportData.ts`)

Update the mapping to include new fields:

```typescript
sugar: item.sugar || 0,
saturated_fat: item.saturated_fat || 0,
sodium: item.sodium || 0,
cholesterol: item.cholesterol || 0,
```

---

#### 7. CSV Export (`src/lib/csv-export.ts`)

Add new columns to the food log export:

```typescript
const headers = [
  'Date', 'Time', 'Food Item', 'Calories', 
  'Protein (g)', 'Carbs (g)', 'Fiber (g)', 'Sugar (g)', 
  'Fat (g)', 'Saturated Fat (g)', 
  'Sodium (mg)', 'Cholesterol (mg)', 
  'Raw Input'
];

// Row mapping:
rows.push([
  entry.eaten_date,
  time,
  item.description,
  item.calories,
  item.protein,
  item.carbs,
  item.fiber || 0,
  item.sugar || 0,
  item.fat,
  item.saturated_fat || 0,
  item.sodium || 0,
  item.cholesterol || 0,
  entry.raw_input || '',
]);
```

---

#### 8. Components Using DailyTotals

Update any components that receive `DailyTotals` to handle the expanded interface. These files don't display the new fields but need updated types:

- `src/components/MacroSummary.tsx` - No visual change, just receives larger object
- `src/components/FoodEntryCard.tsx` - Passes totals through

---

### Backwards Compatibility

| Scenario | Behavior |
|----------|----------|
| Old entries (no new fields) | All new fields default to `0` when read |
| New entries | Include AI-estimated values for all fields |
| Saved meals | New fields included when meal is saved |
| Re-logged saved meals | New fields preserved from original |

---

### Summary

| Component | Change Type |
|-----------|-------------|
| `_shared/prompts.ts` | Add 4 new fields to AI prompt |
| `analyze-food/index.ts` | Parse and calculate totals for new fields |
| `src/types/food.ts` | Add optional fields to FoodItem, update DailyTotals |
| `src/hooks/useAnalyzeFood.ts` | Update result interface |
| `src/hooks/useFoodEntries.ts` | Map new fields when reading entries |
| `src/hooks/useExportData.ts` | Include new fields in export mapping |
| `src/lib/csv-export.ts` | Add 4 new columns to CSV export |
| **Database** | No migration needed (JSONB) |
