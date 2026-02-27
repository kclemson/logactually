

## Change substring matching to prefix-only matching

The issue: `isSubstringMatch` currently uses `.includes()`, so "chi" matches "zucchini" (mid-word). It should only match when the shorter word is a **prefix** of a word in the target — "chi" → "chicken" ✓, "chi" → "zucchini" ✗.

### Changes

**`src/lib/text-similarity.ts`** — `isSubstringMatch` (lines 140-150):

Replace the `.includes()` containment check with `.startsWith()`:

```typescript
function isSubstringMatch(word1: string, word2: string): boolean {
  if (word1 === word2) return true;
  if (word1.length < 3 || word2.length < 3) return false;
  // Only match if the shorter word is a prefix of the longer one
  const [shorter, longer] = word1.length <= word2.length ? [word1, word2] : [word2, word1];
  return longer.startsWith(shorter);
}
```

**`src/lib/text-similarity.test.ts`** — update the substring test (line ~155):

The existing test `hybridSimilarityScore(['lemon'], 'lemonade iced tea')` still passes (prefix match). The test for `['chia']` vs `'chocolate chip cookie'` already expects 0. Add a new test confirming mid-word rejection:

```typescript
it('does not match mid-word substrings', () => {
  const score = hybridSimilarityScore(['chi'], 'zucchini parmesan');
  expect(score).toBe(0);
});

it('matches prefix substrings', () => {
  const score = hybridSimilarityScore(['chi'], 'chicken breast');
  expect(score).toBeGreaterThan(0);
});
```

