

## Reduce verification fragility: heuristic-first, AI-second

### The problem

The main realistic failure mode isn't "wrong field mapping" (modern LLMs handle this fine) -- it's the **null cop-out**, where the AI declares `verification: null` on a chart that IS verifiable. The current code trusts that declaration and skips verification entirely.

### The fix

Flip the priority in `verifyChartData`: try the deterministic heuristic FIRST, and only fall back to the AI's self-declared verification when the heuristic can't help. This is a small reorder of the existing logic, not a new system.

**`src/lib/chart-verification.ts` -- change `verifyChartData`:**

Current order:
1. If AI says `null` → give up
2. If AI declared a verification object → use it
3. No verification field → legacy heuristic

New order:
1. Try heuristic first (it's deterministic and trustworthy)
2. If heuristic returns "unavailable", THEN check the AI's declaration
3. If AI says `null` → give up

This means:
- A simple "calories per day" chart verifies via heuristic even if the AI incorrectly returns `verification: null`
- A "workout days vs rest days" aggregate chart still uses the AI's declared breakdown (heuristic can't handle aggregates)
- The AI's declaration is only consulted when our own logic can't figure it out

Additionally, when the AI declares `type: "daily"` and the heuristic also has a mapping, we can cross-check: if the AI's `field` disagrees with the heuristic's mapping, prefer the heuristic (it's deterministic). This is a one-line guard, not architectural complexity.

### Technical details

```text
verifyChartData(spec, dailyTotals):
  1. Run verifyLegacy(spec, dailyTotals)
  2. If result.status === "success" → return it
  3. If spec.verification?.type === "daily" → return verifyDaily(spec, dailyTotals)
  4. If spec.verification?.type === "aggregate" → return verifyAggregate(spec, dailyTotals)
  5. If spec.verification === null → return unavailable with reason
  6. Return unavailable (no verification possible)
```

For daily cross-check: in `verifyDaily`, look up `spec.dataKey` in `FOOD_KEY_MAP`/`EXERCISE_KEY_MAP`. If a mapping exists and disagrees with `spec.verification.field`, override with the heuristic's field.

### Files changed

| File | Change |
|---|---|
| `src/lib/chart-verification.ts` | Reorder `verifyChartData` to try heuristic first; add field cross-check in `verifyDaily` |

