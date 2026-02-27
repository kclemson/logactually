

## Replace fuzzy matching with substring matching

### Changes

**`src/lib/text-similarity.ts`**

1. Replace `isFuzzyMatch` (lines 177-182) with a substring check:
```typescript
function isSubstringMatch(word1: string, word2: string): boolean {
  if (word1 === word2) return true;
  if (word1.length < 3 || word2.length < 3) return false;
  return word1.includes(word2) || word2.includes(word1);
}
```

2. Replace `fuzzySetHas` (lines 187-192) to use `isSubstringMatch`:
```typescript
function substringSetHas(word: string, targetSet: Set<string>): boolean {
  for (const target of targetSet) {
    if (isSubstringMatch(word, target)) return true;
  }
  return false;
}
```

3. Update both call sites in `hybridSimilarityScore` (lines 255, 262) from `fuzzySetHas` → `substringSetHas`.

4. Remove `levenshteinDistance` (lines 139-169) — no longer used.

**`src/lib/text-similarity.test.ts`**

- Update the "fuzzy matches close spellings" test — `"chiken"` will no longer match `"chicken"` (not a substring). Change to test substring behavior instead (e.g., `"lemon"` matches `"lemonade"`).

### Behavior changes
- "chia" no longer matches "chip" ✓
- "lemon" matches "lemonade" ✓
- "chiken" no longer matches "chicken" (acceptable trade-off — typo tolerance removed)

