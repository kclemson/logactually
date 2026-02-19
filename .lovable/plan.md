

## Add documentation comments to `verifyDeterministic` and `verifyDaily`

### What changes

**Single file: `src/lib/chart-verification.ts`**

Add JSDoc-style block comments above both functions explaining what they do, when they're used, their confidence level, and concrete examples.

#### `verifyDeterministic` (line 225)

Add a comment block like:

```text
/**
 * Deterministic verification using hardcoded field maps and arithmetic formulas.
 * This is the highest-confidence verification path -- it computes expected values
 * from authoritative daily totals using known mappings, with zero reliance on
 * anything the AI declared.
 *
 * Confidence: HIGH -- results are mathematically certain for supported metrics.
 *
 * What it handles (with examples):
 *   - Direct field lookups: dataKey "calories" -> food daily total "cal" field
 *   - Direct field lookups: dataKey "sets" -> exercise daily total "sets" field
 *   - Single-source derived formulas: dataKey "fat_pct" -> (fat * 9 / cal) * 100
 *   - Single-source derived formulas: dataKey "net_carbs" -> carbs - fiber
 *   - Per-meal derived formulas: dataKey "protein_per_meal" -> protein / entries
 *   - Cross-domain (mixed) formulas: dataKey "net_calories" -> food cal - exercise cal_burned
 *
 * What it cannot handle (falls through to verifyDaily/verifyAggregate):
 *   - Aggregated/bucketed charts (e.g. "average calories by weekday")
 *   - Metrics not in the mapping tables (e.g. custom or novel AI-invented keys)
 *   - Charts without date-indexed data points
 */
```

#### `verifyDaily` (line 27)

Add a comment block like:

```text
/**
 * AI-declaration-driven verification for daily (one-point-per-date) charts.
 * Uses the verification metadata the AI attached to the chart spec (source, field,
 * type: "daily") to know where to look up actual values. However, it cross-checks
 * the AI's declared field against our known field maps (FOOD_KEY_MAP, EXERCISE_KEY_MAP,
 * DERIVED_FORMULAS) and prefers the known mapping when one exists -- this catches
 * cases where the AI declares a slightly wrong field name.
 *
 * Confidence: MEDIUM -- the lookup source is AI-declared (could be wrong), but
 * cross-checking against known maps upgrades confidence for recognized metrics.
 *
 * When it runs: Only as a fallback when verifyDeterministic returned "unavailable"
 * and the AI declared verification.type === "daily".
 *
 * Examples:
 *   - AI declares { source: "food", field: "cal", type: "daily" } for a calories
 *     chart. Cross-check finds "cal" in FOOD_KEY_MAP, so we use the known mapping
 *     (same result, but we trust our map over the AI's declaration).
 *   - AI declares { source: "food", field: "avg_sodium", type: "daily" } for a
 *     metric we don't recognize. No cross-check match, so we trust the AI's
 *     declared field and look up "avg_sodium" in food daily totals directly.
 */
```

No logic changes. Just documentation.
