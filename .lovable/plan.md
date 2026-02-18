

## Update Ghost Text for Food and Exercise Inputs

### Overview
Update placeholder examples in both input components to reflect diverse real-world usage patterns, add cardio/lifestyle variety to exercise examples, and showcase smartwatch-style data logging.

### Files to Update

1. **`src/components/LogInput.tsx`** -- `FOOD_PLACEHOLDER_EXAMPLES`, `WEIGHTS_PLACEHOLDER_EXAMPLES_LBS`, `WEIGHTS_PLACEHOLDER_EXAMPLES_KG`
2. **`src/components/FoodInput.tsx`** -- `PLACEHOLDER_EXAMPLES` array (must match food list)

### Food Examples (10 total)

Keep (7):
1. "McDs egg mcmuffin and like half the hash brown"
2. "grande oat milk latte from Starbucks and most of a banana"
3. "Chipotle bowl with chicken and extra guac"
4. "blueberry muffin but only the top part"
5. "protein bar (the kirkland ones from costco)"
6. "leftover Domino's, two and a half slices of pepperoni"
7. "a slice of banana bread from this recipe but without the nuts: https://natashaskitchen.com/banana-bread-recipe-video/"

Drop: "lean cuisine alfredo noodles..."

Add (3):
8. "In-N-Out double double animal style and half a chocolate shake"
9. "two cups of coffee with a splash of oat milk"
10. "a few bites of brownie batter while baking, maybe 150 calories worth"

### Exercise Examples - lbs (9 total)

1. "bench press 4x8 at 135" (keep)
2. "squats 5x5 at 185 lbs, then leg press 3x12 at 200" (keep)
3. "ran 2 miles in 18 minutes, avg heart rate 145bpm" (new -- running + watch data)
4. "45 min bike ride, moderate pace, about 8 miles" (new -- cycling + effort + distance)
5. "swam laps for 30 minutes, felt like a hard effort" (new -- swimming + subjective effort)
6. "walked the dog for 40 minutes, 1.2 miles, 108 avg HR" (new -- from user's own data)
7. "20 min on the stairmaster at level 7, burned about 200 cal" (new -- machine + calories)
8. "gardening for 30 minutes, just pruning so not too heavy" (new -- from user's own data)
9. "leg extensions and hamstring curls, 3 sets each" (keep)

### Exercise Examples - kg (9 total)

1. "bench press 4x8 at 60 kg"
2. "squats 5x5 at 85 kg, then leg press 3x12 at 90 kg"
3. "ran 3k in 18 minutes, avg heart rate 145bpm"
4. "45 min bike ride, moderate pace, about 13 km"
5. "swam laps for 30 minutes, felt like a hard effort"
6. "walked the dog for 40 minutes, 3 km, 112 avg HR"
7. "20 min on the stairmaster at level 7, burned about 200 cal"
8. "gardening for 30 minutes, just pruning so not too heavy"
9. "leg extensions and hamstring curls, 3 sets each"

### Technical Notes

- Existing prefix patterns ("Describe what you ate, such as: ..." / "Describe your workout: ...") unchanged
- Random selection logic unchanged (one per component mount)
- Both `FoodInput.tsx` and `LogInput.tsx` food arrays updated identically
- Effort qualifiers in 3 exercise examples: "moderate pace", "felt like a hard effort", "not too heavy"
- Watch/fitness data in 3 examples: heart rate (#3, #6), calories (#7)
- Mix: 2 strength, 3 cardio (run/bike/swim), 1 machine, 2 lifestyle (walk/garden), 1 no-weight strength

