

## Promote Experimental Weights Prompt to Default

Copy the `ANALYZE_WEIGHTS_PROMPT_EXPERIMENTAL` content into `ANALYZE_WEIGHTS_PROMPT_DEFAULT` in `supabase/functions/_shared/prompts.ts`.

### What changes

**File: `supabase/functions/_shared/prompts.ts`**

Replace the body of `ANALYZE_WEIGHTS_PROMPT_DEFAULT` with the exact content of `ANALYZE_WEIGHTS_PROMPT_EXPERIMENTAL`. This adds the "EXERCISE METADATA (optional)" section and the updated response format example (with the multi-field metadata example) to the production prompt.

After this, both prompts will be identical. No other files change.

