

## Make Demo Raw Inputs More Natural (Without Going Overboard)

### Problem
The "shorthand" category has inputs that are too clean and simple (e.g., "greek yogurt", "protein bar", "eggs and toast"). These don't demonstrate the app's natural language parsing power.

### Approach
Rewrite the **shorthand** category inputs to be more realistic - the way people actually type when they're being descriptive but efficient. Not overly casual ("from that cafe") but not robotic either.

---

### Guiding Principles

**DO:**
- Include quantities naturally: "2 eggs scrambled with toast"
- Use abbreviations people actually use: "pb", "w/", "oz"
- Include prep methods: "grilled chicken over rice"
- Mention sizes/amounts: "handful of almonds", "big salad"
- Use natural phrasing: "chicken and rice", not "grilled chicken and rice"

**DON'T:**
- Add filler words: "probably", "just", "honestly"
- Reference vague places: "from the place", "from that cafe"  
- Add opinions: "too much ranch", "turned out great"
- Over-explain: "the kirkland ones from costco"

---

### File Changed

| File | Change |
|------|--------|
| `supabase/functions/populate-demo-data/index.ts` | Rewrite shorthand rawInput strings (~40 entries) |

---

### Examples of Changes

**Breakfast shorthand:**

| Before | After |
|--------|-------|
| `eggs and toast` | `2 eggs scrambled with buttered toast` |
| `yogurt and granola` | `greek yogurt with granola and blueberries` |
| `avocado toast` | `avocado toast on sourdough` |
| `protein shake` | `whey protein shake with almond milk` |
| `overnight oats` | `overnight oats with chia and berries` |
| `english muffin with pb` | `english muffin with peanut butter` |

**Lunch shorthand:**

| Before | After |
|--------|-------|
| `turkey sandwich` | `turkey sandwich on wheat with lettuce and tomato` |
| `salad with chicken` | `big salad with grilled chicken` |
| `leftover pasta` | `leftover spaghetti, about 2 cups` |
| `burrito bowl` | `chicken burrito bowl with rice beans and guac` |
| `sushi (8 pieces)` | `salmon roll, 8 pieces` |
| `mediterranean bowl` | `falafel bowl with hummus and tabbouleh` |

**Dinner shorthand:**

| Before | After |
|--------|-------|
| `salmon and veggies` | `baked salmon with roasted vegetables` |
| `chicken stir fry` | `chicken stir fry with mixed veggies` |
| `tacos (3)` | `3 beef tacos with cheese and salsa` |
| `pizza (2 slices)` | `2 slices pepperoni pizza` |
| `burger and fries` | `cheeseburger with medium fries` |
| `shrimp scampi` | `shrimp scampi over linguine` |

**Snack shorthand:**

| Before | After |
|--------|-------|
| `apple with peanut butter` | `apple slices with 2 tbsp peanut butter` |
| `handful of almonds` | `handful of almonds, maybe 20` |
| `protein bar` | `chocolate protein bar` |
| `greek yogurt` | `plain greek yogurt, 1 cup` |
| `carrots and hummus` | `baby carrots with hummus` |
| `popcorn` | `3 cups popcorn, air popped` |

---

### Scope

Only updating the **shorthand** category (lines 70-210). The **casual** category already has good natural phrasing, and **brand/recipe/barcode** have specific formats that should stay as-is.

---

### Summary

Changes make inputs:
- More descriptive (quantities, prep methods, specifics)
- Still efficient (no fluff, no opinions)
- Realistic (how someone tracking macros would actually type)

