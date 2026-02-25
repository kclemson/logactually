

# Revised approach: Generic distance approximation guidance

## Problem with the swimming-specific approach
Adding explicit "1 lap = 50m" conversion logic to the prompt risks biasing the model toward swimming interpretations for ambiguous inputs. It's also brittle — we'd need to keep adding sport-specific rules as new cases appear.

## Better approach
Instead of sport-specific conversion rules, add a general instruction near the `distance_miles` field that encourages the model to approximate distance from common units when it can do so confidently. The model already knows that a swimming lap is ~50m and that a rowing "500m piece" is 500m — it just needs permission to convert.

### Change

**`supabase/functions/_shared/prompts.ts`** — In both the default and experimental prompt templates, update the `distance_miles` line from:

```
- distance_miles: distance in miles (number), if relevant. Convert km to miles (1km = 0.621mi).
```

to:

```
- distance_miles: distance in miles (number), if relevant. Convert km to miles (1km = 0.621mi). If the user provides distance in another common unit (e.g., laps, meters, yards), convert to miles using standard assumptions.
```

This appears in two places (default prompt and experimental prompt). Both get the same update.

### Why this works
- The model already has world knowledge about lap distances, meter conversions, etc.
- "Standard assumptions" gives it latitude without over-specifying
- No sport-specific language that could bias unrelated inputs
- Covers rowing meters, swimming laps/yards, and any future unit naturally

### Files

| File | Change |
|---|---|
| `supabase/functions/_shared/prompts.ts` | Update `distance_miles` description in both prompt templates (2 occurrences) |

