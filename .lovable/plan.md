

## Copy Derivation Instruction to Default Prompt

### Change

**File: `supabase/functions/_shared/prompts.ts`**

Add the same generic derivation line that's already in the experimental prompt to `ANALYZE_WEIGHTS_PROMPT_DEFAULT`, in the same position -- after the `distance_miles` bullet (around line 139):

```
If the user provides two values that allow calculating a third (e.g., speed + duration → distance, duration + distance → speed), perform the calculation and include the derived value.
```

### Deployment
- Redeploy the `analyze-weights` edge function.

