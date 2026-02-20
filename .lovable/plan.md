
# Fix: dayClassification `only_keys` rule produces empty chart

## Root cause

The bug is in the `only_keys` matching logic in `src/lib/chart-dsl.ts` (lines 415-430).

`exerciseKeysByDate` stores BOTH plain key tokens AND compound tokens per day. For a day with `walk_run:walking`, the set contains:

```
["walk_run", "walk_run:walking"]
```

The current `only_keys` check does `tokens.every(token => ...)` — meaning every token in the array must be covered by the allowlist. With allowlist `["walk_run:walking"]`:

- `"walk_run:walking"` — covered ✓
- `"walk_run"` — NOT covered (the entry `"walk_run:walking"` has a colon, so the `!entry.includes(":")` guard blocks the plain-key fallback) ✗

So `matches = false` for every day, producing zero results.

## The fix

The plain key token (`"walk_run"`) is structurally redundant — it's already represented by its compound variants (`"walk_run:walking"`). When evaluating `only_keys`, we should **skip plain key tokens that have at least one compound variant present** in the token set, since the compound token will be evaluated instead.

More precisely, the check should be: only evaluate a token if it is either:
1. A compound token (`key:subtype`) — always evaluate these
2. A plain key token with NO compound variants in the set for that key — evaluate as-is (e.g., a day with a strength exercise that has no subtype)

This preserves correct behavior for:
- `"bench_press"` (no subtype ever) → evaluated as a plain key, correctly fails the `"walk_run:walking"` allowlist
- `"walk_run"` with `"walk_run:walking"` present → skip the plain token, evaluate `"walk_run:walking"` instead → correctly covered
- `"walk_run"` with `"walk_run:running"` present → skip the plain token, evaluate `"walk_run:running"` → NOT covered by `"walk_run:walking"` allowlist → correctly fails

## Technical change

Single file: `src/lib/chart-dsl.ts`, `case "only_keys"` block (lines 415-430).

Change from evaluating `tokens.every(...)` on all tokens, to:

```ts
case "only_keys": {
  const allowlist = classify.keys ?? [];
  const tokenSet = new Set(tokens);
  // For each token, skip plain keys that have a compound variant present
  // (the compound variant will be evaluated instead, which is more specific)
  const tokensToEvaluate = tokens.filter(token => {
    if (token.includes(":")) return true; // always evaluate compound tokens
    // Skip this plain key if any "key:subtype" variant exists in the set
    return !tokens.some(t => t.startsWith(`${token}:`));
  });
  matches = tokensToEvaluate.length > 0 && tokensToEvaluate.every(token => {
    return allowlist.some(entry => {
      if (entry === token) return true;
      // Plain allowlist entry covers any compound variant of that key
      if (!entry.includes(":") && token.startsWith(`${entry}:`)) return true;
      return false;
    });
  });
  break;
}
```

This is the minimal, surgical fix. No data fetching changes, no type changes, no prompt changes. One switch-case block changes in one file.

## Why `tokensToEvaluate.length > 0` matters

This keeps the existing guard that days with zero tokens (no exercise logged) are excluded from both buckets. An empty day won't accidentally count as a "rest day".

## Verification

After the fix, a day with `["walk_run", "walk_run:walking"]` and allowlist `["walk_run:walking"]`:
- `tokensToEvaluate` = `["walk_run:walking"]` (plain `"walk_run"` skipped because `"walk_run:walking"` exists)
- `"walk_run:walking"` covered by `"walk_run:walking"` → `matches = true` ✓

A mixed day with `["walk_run", "walk_run:walking", "bench_press"]` and same allowlist:
- `tokensToEvaluate` = `["walk_run:walking", "bench_press"]`
- `"walk_run:walking"` → covered ✓
- `"bench_press"` → NOT in allowlist → `matches = false` ✓

A day with only strength `["bench_press", "squat"]` and same allowlist:
- `tokensToEvaluate` = `["bench_press", "squat"]` (no subtypes, so plain keys are evaluated)
- Both fail → `matches = false` ✓
