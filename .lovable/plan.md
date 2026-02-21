

# Update ask-trends-ai to read from promoted columns

## Problem
The `ask-trends-ai` edge function reads `effort` and `calories_burned` from the `exercise_metadata` JSONB field. Since the client now strips these keys from JSONB on insert, new entries will have these values only in the promoted columns (`effort`, `calories_burned_override`), making them invisible to the AI.

## Change

### `supabase/functions/ask-trends-ai/index.ts`

1. Add `effort` and `calories_burned_override` to the `.select()` string for the `weight_sets` query.

2. Update the exercise context builder to read from the promoted columns instead of JSONB:
   - `s.effort` instead of `meta.effort`
   - `s.calories_burned_override` instead of `meta.calories_burned`

3. Remove the `exercise_metadata` field from the select entirely (no longer needed for this function) and remove the `meta` variable and its conditional block.

### Result
The context lines will still produce the same output format (`effort: X/10`, `reported: Y cal`) but sourced from the promoted DB columns.

