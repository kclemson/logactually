

## Allow shorter prefix for the word currently being typed

**Insight**: When the user types "mac and ch", the word "ch" is the one *actively being typed*. Earlier words like "mac" are already committed. We should be strict about completed words (≥3 chars for prefix) but lenient with the last word (≥2 chars), since the preceding words already provide enough context to avoid false positives.

### Changes

**`src/lib/text-similarity.ts`**

1. Add a new helper `isPrefixOfRelaxed` that allows 2-char prefixes (for the in-progress word):

```ts
function isPrefixOfRelaxed(query: string, target: string): boolean {
  if (query === target) return true;
  if (query.length < 2) return false;
  return target.startsWith(query);
}
```

2. In `hybridSimilarityScore`, treat the **last** word in `candidateFoodWords` as the in-progress word and use relaxed matching for it, strict matching for the rest:

```ts
// All words except the last must match strictly (≥3 char prefix)
// The last word (actively being typed) uses relaxed matching (≥2 char prefix)
let matchedCount = 0;
const lastIdx = candidateFoodWords.length - 1;
for (let i = 0; i < candidateFoodWords.length; i++) {
  const word = candidateFoodWords[i];
  if (i === lastIdx
    ? queryMatchesTargetSetRelaxed(word, targetSet)
    : queryMatchesTargetSet(word, targetSet)) {
    matchedCount++;
  }
}
```

3. Add `queryMatchesTargetSetRelaxed` that uses `isPrefixOfRelaxed`.

**`src/lib/text-similarity.test.ts`**

Add test:
```ts
it('matches 2-character prefix on last word only', () => {
  // "ch" is the last (in-progress) word → relaxed prefix match
  expect(hybridSimilarityScore(['mac', 'ch'], 'annie mac and cheese')).toBeGreaterThan(0);
});

it('rejects 2-character prefix on non-last word', () => {
  // "ch" is the first word, not in-progress → strict 3-char minimum
  expect(hybridSimilarityScore(['ch', 'mac'], 'annie mac and cheese')).toBe(0);
});
```

