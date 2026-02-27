

## Fix prefix match direction in isSubstringMatch

**`src/lib/text-similarity.ts`** — change `isSubstringMatch` to only match when the **input word** is a prefix of the **target word**, not vice versa. Since the function doesn't know which argument is input vs target, push the directionality into `substringSetHas` instead:

1. Remove the bidirectional logic from `isSubstringMatch` — make it a simple one-directional prefix check: `target.startsWith(query)`
2. Rename/refactor `isSubstringMatch(word1, word2)` → `isPrefixOf(query, target)` for clarity
3. Update `substringSetHas` accordingly: check if the query is a prefix of any word in the target set

**`src/lib/text-similarity.test.ts`** — add a test case:

```typescript
it('does not match when target word is prefix of input word', () => {
  // "oatm" should NOT match "oat" (target is prefix of input, wrong direction)
  const score = hybridSimilarityScore(['oatm'], 'oat honey protein granola');
  expect(score).toBe(0);
});

it('matches when input word is prefix of target word', () => {
  // "oatm" SHOULD match "oatmeal"
  const score = hybridSimilarityScore(['oatm'], 'protein oatmeal');
  expect(score).toBeGreaterThan(0);
});
```

