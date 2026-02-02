

## Bulk AI Processing for Demo Data (10-15 Item Batches)

### Overview
Refactor `populate-demo-data` to call the AI in small batches (10-15 items each) using the same system prompt as `analyze-food`. This ensures demo entries show realistic AI parsing behavior while avoiding timeout risks.

---

### Batch Strategy

| Meal Type | Inputs | Batches (10 each) |
|-----------|--------|-------------------|
| Breakfast | 30 | 3 |
| Lunch | 30 | 3 |
| Dinner | 30 | 3 |
| Snack | 30 | 3 |
| **Total** | **120** | **12 calls** |

Estimated time: 30-60 seconds total (vs 3-5 min for individual calls)

---

### File Changes

| File | Change |
|------|--------|
| `supabase/functions/populate-demo-data/index.ts` | Replace `POLISHED_FOODS` with raw inputs + bulk AI logic |
| `supabase/functions/_shared/prompts.ts` | Add bulk parsing prompt helper |

---

### New Data Structure

Replace 400+ lines of pre-baked `POLISHED_FOODS` with simple input arrays:

```typescript
const DEMO_FOOD_INPUTS = {
  breakfast: [
    '2 eggs scrambled with buttered toast',
    'greek yogurt with granola and blueberries',
    'oatmeal with sliced banana and honey',
    'everything bagel with cream cheese',
    'protein shake with banana',
    // ... 30 total per meal type
  ],
  lunch: [...],
  dinner: [...],
  snack: [...],
};
```

---

### Bulk Parsing Logic

```typescript
const BATCH_SIZE = 10;

async function bulkParseWithAI(inputs: string[]): Promise<Map<string, FoodItem[]>> {
  const results = new Map<string, FoodItem[]>();
  
  // Process in batches of 10
  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const batch = inputs.slice(i, i + BATCH_SIZE);
    
    const systemPrompt = getAnalyzeFoodPrompt('default');
    const userPrompt = buildBulkUserPrompt(batch);
    
    const response = await callLovableAI(systemPrompt, userPrompt);
    
    // Map results back to input strings
    response.results.forEach((r, idx) => {
      results.set(batch[idx], r.food_items);
    });
    
    // Small delay between batches
    await delay(200);
  }
  
  return results;
}
```

---

### Bulk User Prompt Template

```typescript
function buildBulkUserPrompt(inputs: string[]): string {
  return `Parse these ${inputs.length} food entries. For each input, analyze it exactly as you would individually.

Inputs:
${inputs.map((input, i) => `${i + 1}. "${input}"`).join('\n')}

Return JSON array with results in same order as inputs:
{
  "results": [
    { "food_items": [{ "name": "...", "portion": "...", "calories": 0, ... }] },
    ...
  ]
}`;
}
```

---

### Execution Flow

1. **Collect unique inputs**: All 120 raw input strings
2. **Batch by meal type**: 3 batches of 10 per meal type = 12 total calls
3. **Call AI for each batch**: With retry logic on failure
4. **Cache results**: Map input string -> parsed food_items
5. **Generate entries**: For each day in range, look up cached results
6. **Insert to DB**: Same insert logic as before

```typescript
// Main flow
const parsedCache = new Map<string, FoodItem[]>();

for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack']) {
  const inputs = DEMO_FOOD_INPUTS[mealType];
  const results = await bulkParseWithAI(inputs);
  results.forEach((items, input) => parsedCache.set(input, items));
}

// For each day, use cached results
for (const day of dateRange) {
  const dayIndex = getDayIndex(day);
  const breakfastInput = DEMO_FOOD_INPUTS.breakfast[dayIndex % 30];
  const breakfastItems = parsedCache.get(breakfastInput);
  // ... insert entry
}
```

---

### Error Handling

```typescript
async function callLovableAI(system: string, user: string, retries = 2): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature: 0.3,
        }),
      });
      
      if (!response.ok) throw new Error(`AI call failed: ${response.status}`);
      
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      if (attempt === retries) throw error;
      console.log(`Retry ${attempt + 1} for AI call...`);
      await delay(1000);
    }
  }
}
```

---

### Input List (30 per meal type)

Will curate 30 realistic inputs per category covering variety of:
- Quantities and portions
- Cooking methods
- Common abbreviations
- Multi-item meals
- Simple vs complex entries

Examples already defined in current codebase will be reused where appropriate.

---

### Weight Entries

Keep weight generation as-is (local/deterministic) since:
- Weight parsing is already standardized ("bench 135 3x10")
- Less variation in output format
- AI would return essentially same structure

---

### Summary

| Aspect | Before | After |
|--------|--------|-------|
| Code lines | 400+ pre-baked | ~150 raw inputs |
| AI calls | 0 (fake data) | 12 bulk calls |
| Execution time | Instant | ~30-60 sec |
| Demo realism | Fake outputs | Real AI parsing |
| Maintenance | Update items+macros | Just update input strings |

