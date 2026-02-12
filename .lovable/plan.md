

## Add Shared Prompt Chips Across Food and Exercise

### What Changes

In `src/components/AskTrendsAIDialog.tsx`, introduce a new `SHARED_PROMPTS` array containing the four cross-cutting prompts, and remove those same prompts from `FOOD_PROMPTS` and `EXERCISE_PROMPTS` where they currently appear.

### Details

1. Add a new constant `SHARED_PROMPTS` with these four items:
   - "What assumptions might I be making that my logs challenge?"
   - "Do you have suggestions for simple swaps or improvements I could make?"
   - "If I stopped improving for 6 months, what would likely be the reason based on this data"
   - "What behavioral patterns might I not be noticing?"

2. Remove those four strings from `FOOD_PROMPTS` and `EXERCISE_PROMPTS` (currently duplicated across both).

3. Update the `chips` memo to combine the shared and mode-specific pools before picking 4 random chips:
   ```
   const pool = [...SHARED_PROMPTS, ...(mode === "food" ? FOOD_PROMPTS : EXERCISE_PROMPTS)];
   return pickRandom(pool, 4);
   ```

This keeps the same UX (4 random chips per open) but ensures the cross-cutting prompts can appear in either mode without duplication.

