

## Revert "if available" back to "if relevant" in Experimental Prompt

### Change

**File: `supabase/functions/_shared/prompts.ts`** (line 213)

Revert the experimental prompt's `distance_miles` bullet from:

```
- distance_miles: distance in miles (number), if available. Convert km to miles (1km = 0.621mi).
```

back to:

```
- distance_miles: distance in miles (number), if relevant. Convert km to miles (1km = 0.621mi).
```

### Deployment
- Redeploy the `analyze-weights` edge function.

### Next: Discuss explicit distance-from-speed instruction

Once reverted, we can discuss adding an explicit instruction like:

> "If the user provides speed and duration but not distance, calculate it (e.g., 5 mph for 30 min = 2.5 miles)."

This would go in the experimental prompt's cardio section -- either as a bullet point addition or as a note after the field list. A few options to consider:

1. **Add a calculation instruction bullet** after the `distance_miles` field definition
2. **Add a "Tips" or "Notes" subsection** under the cardio section with derivation rules
3. **Add an example** to the existing examples list showing speed+duration producing a distance value

Each approach has different tradeoffs in terms of prompt length vs. clarity. Happy to discuss which feels right once the revert is done.

