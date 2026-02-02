

## Default Sets/Reps in Code (Not Prompt)

### Overview
Instead of updating the AI prompt, we'll apply sensible defaults in our normalization code when the AI returns an exercise with missing sets or reps. The user immediately sees these values and can edit them.

---

### Changes

| File | Change |
|------|--------|
| `supabase/functions/analyze-weights/index.ts` | Apply defaults for missing sets/reps |

---

### Implementation

**Lines 197-205** - After coercing to numbers, apply defaults before validation:

```typescript
// Lenient coercion - accept nulls, undefined, strings, coerce to 0
let sets = Number(exercise.sets) || 0;
let reps = Number(exercise.reps) || 0;
const weight_lbs = Number(exercise.weight_lbs) || 0;
const duration_minutes = Number(exercise.duration_minutes) || 0;
const distance_miles = Number(exercise.distance_miles) || 0;

// Default missing sets/reps for weight exercises
// User sees these immediately and can edit
if (weight_lbs > 0 || (sets > 0 || reps > 0)) {
  if (sets === 0) sets = 1;
  if (reps === 0) reps = 10;
}

// Valid if EITHER weight data OR cardio data present
const hasWeightData = sets > 0 && reps > 0;
const hasCardioData = duration_minutes > 0 || distance_miles > 0;
```

---

### Logic

- If the AI returns **any** weight-related data (weight > 0, or sets > 0, or reps > 0), treat it as a weight exercise
- Apply defaults: **1 set** if missing, **10 reps** if missing
- Validation then passes because `sets > 0 && reps > 0` is true
- User sees "1 set × 10 reps @ 75 lbs" and can immediately correct it

---

### Examples

| Input | AI Returns | After Defaults | User Sees |
|-------|-----------|----------------|-----------|
| "chin ups 2 sets at 75lb" | sets=2, reps=null, weight=75 | sets=2, reps=10, weight=75 | 2×10 @ 75lb ✓ |
| "bench 225" | sets=null, reps=null, weight=225 | sets=1, reps=10, weight=225 | 1×10 @ 225lb ✓ |
| "3x10 squats 185" | sets=3, reps=10, weight=185 | unchanged | 3×10 @ 185lb ✓ |
| "treadmill 30 min" | cardio data | unchanged (cardio path) | 30 min ✓ |

---

### Why This Is Better Than Prompt Changes

- **Deterministic**: Always the same defaults, no AI interpretation variability
- **Simpler**: One code change vs. prompt engineering
- **Immediate feedback**: User sees defaults right away and can edit
- **Follows Postel's Law**: "Be liberal in what you accept" - already the approach used for other fields

