

## Curate "Ask AI" Prompt Chips for Nuanced Questions Only

### Principle

Remove questions that have a single correct/mathematical answer (or could be answered by the app's existing UI). Keep only questions where an LLM adds real value through reasoning, pattern recognition, and contextual advice.

### Food Prompts

**Remove (math/simple answers):**
- "What's my average daily calorie intake?"
- "Am I getting enough protein?"
- "Do I eat more on weekends?"
- "What's my macro split look like?"
- "Am I eating enough fiber?"
- "What's my highest calorie day?"
- "Am I hitting a good protein-to-calorie ratio?"
- "What are my most common foods?"

**Keep:**
- "How consistent is my eating pattern?"
- "How has my diet changed over time?"
- "Any patterns in my carb intake?"
- "What could I improve about my diet?"
- "Do I have any nutritional gaps?"
- "How much variety is in my diet?"
- "What days do I eat the most?" -- borderline, remove if you prefer

**Add (nuanced replacements):**
- "What nutrients am I consistently lacking?"
- "Are there any surprising patterns in my eating?"
- "How balanced are my meals throughout the day?"
- "What healthy swaps could I make?"
- "What's the weakest area of my diet?"
- "Am I relying too heavily on any one food?"

### Exercise Prompts

**Remove (simple/answerable in app):**
- "What's my most trained muscle group?"
- "Am I making strength progress?"
- "How consistent is my workout schedule?"
- "How has my training volume changed?"
- "Am I training enough each week?"
- "What's my strongest lift?"
- "How much cardio am I doing?"
- "What does my workout frequency look like?"
- "What's my average workout intensity?"
- "How many calories am I burning?"
- "What exercises have I improved the most?"

**Keep:**
- "What exercises should I do more?"
- "Do I have any muscle imbalances?"
- "Am I overtraining any body part?"
- "Any gaps in my training program?"

**Add (nuanced replacements):**
- "How could I make my program more balanced?"
- "What weak points should I prioritize?"
- "Are there any patterns in my training I should change?"
- "What would a trainer suggest I adjust?"
- "Am I neglecting any movement patterns?"
- "How could I improve my exercise variety?"

### Result

Each pool will have roughly 10-12 nuanced prompts (from which 4 are randomly shown). All questions will be ones where an LLM genuinely adds value through reasoning over the data.

### Technical Details

**File:** `src/components/AskTrendsAIDialog.tsx`

Replace the `FOOD_PROMPTS` array (lines 20-36) and `EXERCISE_PROMPTS` array (lines 38-54) with the curated lists above. No other changes needed.

