

## Enhance Demo Data to Showcase AI Translation Power

### Goal
Update demo account data so that:
1. **Food entries**: Raw input looks sloppy/casual, but parsed food items have polished descriptions with realistic macros
2. **Weight entries**: Raw input looks sloppy/casual, but parsed exercises have proper names
3. **Date range**: Extends 30 days into the future so demo always has "today" data

### Current Problems

**Food entries** - Description copies raw input exactly:
| raw_input | description | Problem |
|-----------|-------------|---------|
| "burger and fries" | "burger and fries" | No polishing |
| "got chipotle - chicken bowl with guac" | "got chipotle - chicken bowl with guac" | No transformation |

**Weight entries** - Raw input is already formatted (less impressive):
| raw_input | description |
|-----------|-------------|
| "Bench Press 90lb 4x11" | "Bench Press" |

Should be more like:
| raw_input | description |
|-----------|-------------|
| "bench 90 4x11" | "Bench Press" |

### Solution Architecture

**Phase 1: Create polished food mappings**

Add a `POLISHED_FOODS` structure that maps each raw input to structured output with realistic macros:

```typescript
const POLISHED_FOODS = {
  shorthand: {
    breakfast: [
      { 
        rawInput: 'eggs and toast',
        items: [
          { description: 'Scrambled Eggs', portion: '2 large', calories: 182, protein: 12, carbs: 2, fat: 14 },
          { description: 'Buttered Toast', portion: '2 slices', calories: 186, protein: 4, carbs: 26, fat: 8 },
        ]
      },
      // ... more
    ],
    // lunch, dinner, snack
  },
  casual: { /* similar */ },
  brand: { /* similar */ },
};
```

**Phase 2: Create casual weight input formats**

Add sloppy variations for weight raw inputs:

```typescript
const CASUAL_EXERCISE_FORMATS = [
  (name, weight, sets, reps) => `${name.toLowerCase().replace(/ /g, '')} ${weight} ${sets}x${reps}`,
  (name, weight, sets, reps) => `${name.split(' ')[0].toLowerCase()} ${sets}x${reps} ${weight}`,
  (name, weight, sets, reps) => `${name.toLowerCase()} ${weight}lb ${sets} sets`,
  // Abbreviated versions: "bench", "lat pull", "rdl", "ohp"
];

const EXERCISE_ABBREVIATIONS = {
  'Bench Press': ['bench', 'bp'],
  'Lat Pulldown': ['lat pull', 'pulldown', 'lats'],
  'Romanian Deadlift': ['rdl', 'romanian dl'],
  'Shoulder Press': ['ohp', 'shoulder', 'sp'],
  // ...
};
```

**Phase 3: Extend date range**

Change default endDate from today to today + 30 days:

```typescript
// Line ~670
const thirtyDaysFromNow = new Date(today);
thirtyDaysFromNow.setDate(today.getDate() + 30);
const endDate = params.endDate ? new Date(params.endDate) : thirtyDaysFromNow;
```

### File Changes

**supabase/functions/populate-demo-data/index.ts**

1. **Add `POLISHED_FOODS` mapping** (~lines 65-153 area)
   - Transform existing SHORTHAND_FOODS and CASUAL_FOODS into mappings with polished output
   - Each entry: `{ rawInput: string, items: FoodItem[] }` with realistic USDA-based macros
   - Cover breakfast, lunch, dinner, snack for each category
   - ~25-30 food mappings total

2. **Add `EXERCISE_ABBREVIATIONS`** (~lines 156-179 area)
   - Map canonical exercise names to casual/abbreviated forms
   - Examples: "Bench Press" → ["bench", "bp"], "Romanian Deadlift" → ["rdl"]

3. **Add casual exercise input formatter** (~lines 478-498 area)
   - New formats using abbreviations and casual separators
   - Mix of: "bench 135 3x10", "pulldown 3x10 @ 80", "rdl 95lb 3 sets 10 reps"

4. **Update `generateFoodEntriesForDay()`** (~lines 337-374)
   - Return `{ rawInput: string; items: FoodItem[] }[]` instead of `string[]`
   - Look up polished items from POLISHED_FOODS mapping

5. **Update food insertion logic** (~lines 750-779)
   - Use returned items array instead of copying raw_input
   - Calculate totals from actual item values
   - Support multi-item entries

6. **Update weight raw_input generation** (~lines 478-498)
   - Use casual abbreviations instead of proper names
   - More varied separators and formats

7. **Extend date range** (~line 670)
   - Default to today + 30 days

### Example Transformations After Changes

**Food - Before:**
```json
{ "raw_input": "eggs and toast", "description": "eggs and toast", "calories": 234 }
```

**Food - After:**
```json
{
  "raw_input": "eggs and toast",
  "food_items": [
    { "description": "Scrambled Eggs", "portion": "2 large", "calories": 182, "protein": 12, "carbs": 2, "fat": 14 },
    { "description": "Buttered Toast", "portion": "2 slices", "calories": 186, "protein": 4, "carbs": 26, "fat": 8 }
  ],
  "total_calories": 368
}
```

**Weight - Before:**
```json
{ "raw_input": "Bench Press 90lb 4x11", "description": "Bench Press" }
```

**Weight - After:**
```json
{ "raw_input": "bench 90 4x11, lat pull 80 4x11, rdl 95 4x11", "description": "Bench Press" }
```

### Summary
- ~150 lines of polished food data with realistic macros
- ~20 lines of exercise abbreviations
- ~30 lines of updated generation logic
- ~5 lines for date range extension
- After deploying, invoke the function with `clearExisting: true` to repopulate demo data

