

## Add Generic "Derive What You Can" Instruction to Experimental Prompt

### Change

**File: `supabase/functions/_shared/prompts.ts`** (experimental prompt only)

After the `distance_miles` bullet (around line 213), add a new standalone instruction:

```
If the user provides two values that allow calculating a third (e.g., speed + duration → distance, duration + distance → speed), perform the calculation and include the derived value.
```

This keeps it generic so it covers all combinations (speed+duration, distance+duration, distance+speed) without being specific to any single derivation.

### No example change needed

The existing response format example already shows `duration_minutes` and `distance_miles` together, which is sufficient. Adding the generic instruction should be enough to nudge the AI to derive missing values from whatever is provided.

### Deployment
- Redeploy the `analyze-weights` edge function after the edit.

