

## Rename `verifyLegacy` to `verifyDeterministic`

### What changes

**Single file: `src/lib/chart-verification.ts`**

1. Rename the function `verifyLegacy` to `verifyDeterministic`
2. Update the section comment from `Legacy heuristic fallback (for old cached charts)` to `Deterministic verification via known field/formula mappings`
3. Update the call site in `verifyChartData` (line 323) and its accompanying comments to use the new name
4. Update the comment on line 321 from "deterministic heuristic" to just "deterministic verification" for consistency

No logic changes, no new dependencies, no other files affected.

### Why this name

`verifyDeterministic` accurately describes what the function does: it uses hardcoded field maps and arithmetic formulas to compute expected values with certainty. This contrasts with `verifyDaily` and `verifyAggregate`, which rely on the AI's self-declared verification metadata. The old name "legacy" implied it was temporary or deprecated, when it's actually the most trustworthy verification path.
