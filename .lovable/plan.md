

## Add a brief accuracy audit notice to the system prompt

### What changes
Add 2-3 sentences to the existing DATA INTEGRITY section in the system prompt (`supabase/functions/generate-chart/index.ts`), making the AI aware its output is independently verified — without listing specific failure modes.

### Why keep it short
- Overly specific examples (like "make sure weekdays are actually Mon-Fri") risk anchoring the model on those exact cases while ignoring others
- A broad "we check your math" statement primes the model to be careful across the board
- Less prompt bloat means more token budget for actual data

### The change

Append to the end of the existing DATA INTEGRITY block (after "All numeric values in the data array must be non-negative."):

```
- The client independently verifies your computed values and date-to-bucket assignments against authoritative daily totals. Mismatches are flagged to the user. Double-check your arithmetic and categorical groupings before responding.
```

### File changed

| File | Change |
|---|---|
| `supabase/functions/generate-chart/index.ts` | Append one bullet to DATA INTEGRITY section |

### What stays the same
- No client-side changes
- No schema changes to the verification JSON contract
- No new functions or files
