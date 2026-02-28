

## Problem

Typing "sour crea" produces two candidate words: `["sour", "crea"]`. The containment check asks "what fraction of these words match the target?" — so a candidate like "Cream Cheese" matches `crea` (prefix of `cream`) giving 1/2 = 50% containment, which combined with Jaccard easily clears the 0.25 threshold. The word "sour" doesn't need to match at all.

The fix from the previous plan (containment ≥ 0.75 gate) would catch "sour cream and onion chips" (2/4 = 50%) but NOT "sour crea" (1/2 = 50% — right at the boundary). However, it's still the right approach — we just need to set the gate correctly.

With a 0.75 gate: 1/2 = 0.50 < 0.75 → blocked ✓. But we should also consider edge cases:
- "sour cream" (2 words, both match) → 2/2 = 1.0 ✓
- "chicken" (1 word) → 1/1 = 1.0 ✓  
- "chicken breast" → needs both to match: 2/2 ✓, or 1/2 = 0.5 < 0.75 → blocked ✓
- "sour cream and onion chips" → 2/4 = 0.5 < 0.75 → blocked ✓

A containment gate of **1.0** (ALL input words must match) is actually ideal for typeahead. The user is typing something specific — every word they typed should appear in the candidate. This is different from the similar-entry detection which uses a lower threshold.

## Changes

### `src/lib/text-similarity.ts`
In `hybridSimilarityScore`, after computing `containment` (line 226), add an early return:

```ts
const containment = matchedCount / candidateFoodWords.length;

// Every input word must match something in the target.
// Prevents "sour crea" from matching "cream cheese" (only 1 of 2 words match).
if (containment < 1.0) return 0;
```

**Wait** — this would also affect `findSimilarEntry` which shares the same function. For similar-entry detection, we want slightly looser matching (e.g., "another tilapia like yesterday" after stripping → `["tilapia"]` which is fine, but longer inputs might suffer).

Actually, `findSimilarEntry` calls `extractCandidateFoodWords` first which strips noise words aggressively, so the remaining words ARE all food words that should all match. A 1.0 gate is appropriate there too.

But to be safe and keep the concerns separate, I'll add the gate only in the **typeahead hook** rather than in the shared scoring function.

### `src/hooks/useTypeaheadSuggestions.ts`
In the scoring loop (~line 95), after computing `similarity`, add a containment pre-check:

Actually, the cleanest approach: add an optional `minContainment` parameter to `hybridSimilarityScore` defaulting to 0 (backward compatible), and pass 1.0 from typeahead.

**Simpler**: Just do the containment check inline in the typeahead hook before calling `hybridSimilarityScore`. But that duplicates logic.

**Simplest correct fix**: Add the containment ≥ 1.0 gate directly in `hybridSimilarityScore`. Both consumers (typeahead and similar-entry) benefit — if you typed food words, they should all match.

### Plan

**`src/lib/text-similarity.ts`** — line 226, after `const containment = ...`, add:
```ts
if (containment < 1.0) return 0;
```

**`src/lib/text-similarity.test.ts`** — add two test cases to `hybridSimilarityScore`:
```ts
it('rejects when not all input words match target', () => {
  // "sour crea" → words ["sour", "crea"], target "cream cheese" only matches "crea"
  expect(hybridSimilarityScore(['sour', 'crea'], 'cream cheese')).toBe(0);
});

it('rejects partial phrase overlap', () => {
  expect(hybridSimilarityScore(['sour', 'cream', 'onion', 'chips'], 'sour cream 1 tbsp')).toBe(0);
});
```

