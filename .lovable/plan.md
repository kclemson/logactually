
## Make "logging consistency" charts verifiable

### Problem
The "Daily Logging Consistency" chart counts food entries + exercise entries per day. This is a simple sum of two known fields (`food.entries` + `exercise.sets`), but `verifyDeterministic` doesn't recognize the dataKey the AI uses (likely `total_entries`, `log_count`, or `entries`), so it falls through to the "unavailable" message.

### Fix

**Single file: `src/lib/chart-verification.ts`**

Add new mixed-source derived formulas to `DERIVED_FORMULAS` that cover the likely dataKey names the AI might use for "total logged items per day":

```typescript
// Total daily log entries (food items + exercise sets)
total_entries:       { source: "mixed", compute: (f, e) => (f?.entries || 0) + (e?.sets || 0), tolerance: "default" },
log_count:           { source: "mixed", compute: (f, e) => (f?.entries || 0) + (e?.sets || 0), tolerance: "default" },
total_logs:          { source: "mixed", compute: (f, e) => (f?.entries || 0) + (e?.sets || 0), tolerance: "default" },
daily_entries:       { source: "mixed", compute: (f, e) => (f?.entries || 0) + (e?.sets || 0), tolerance: "default" },
entry_count:         { source: "mixed", compute: (f, e) => (f?.entries || 0) + (e?.sets || 0), tolerance: "default" },
```

This means the next time this chart is generated, `verifyDeterministic` will recognize the dataKey, compute `food.entries + exercise.sets` for each date, and return a "Verified mathematically" result instead of "unavailable."

No logic changes to the verification pipeline -- just expanding the formula dictionary.
