

## Add Fuzzy Word Matching for Spelling Variants

### Problem
The current matching algorithm uses exact word comparison, so "filets" doesn't match "fillets" even though they're the same word with different spellings. This caused "another of the tilapia filets from the other day" to fail matching against "Panko Breaded Tilapia Fillets".

### Solution
Add Levenshtein distance-based fuzzy matching. When checking if an input word matches a target word, allow matches where:
- Edit distance is 1 for short words (≤5 chars)
- Edit distance is ≤2 for longer words (>5 chars)

### Changes

**File: `src/lib/text-similarity.ts`**

1. **Add Levenshtein distance function** (~15 lines):
```typescript
/**
 * Calculate Levenshtein edit distance between two strings.
 * Returns the minimum number of single-character edits needed.
 */
function levenshteinDistance(a: string, b: string): number {
  // Standard DP implementation
}
```

2. **Add fuzzy match helper** (~12 lines):
```typescript
/**
 * Check if two words are a fuzzy match.
 * - Exact match always succeeds
 * - Short words (≤5 chars): allow 1 edit
 * - Longer words: allow 2 edits
 */
function isFuzzyMatch(word1: string, word2: string): boolean {
  if (word1 === word2) return true;
  const maxDistance = word1.length <= 5 ? 1 : 2;
  return levenshteinDistance(word1, word2) <= maxDistance;
}
```

3. **Add fuzzy set membership check** (~10 lines):
```typescript
/**
 * Check if a word fuzzy-matches any word in a set.
 * Returns the matched word if found, null otherwise.
 */
function fuzzySetHas(word: string, targetSet: Set<string>): boolean {
  for (const target of targetSet) {
    if (isFuzzyMatch(word, target)) return true;
  }
  return false;
}
```

4. **Update `hybridSimilarityScore`** to use fuzzy matching:
```typescript
// Before (exact):
if (targetSet.has(word)) matchedCount++;

// After (fuzzy):
if (fuzzySetHas(word, targetSet)) matchedCount++;
```

### Expected Result

| Input | Before | After |
|-------|--------|-------|
| "another of the tilapia filets from the other day" | No match (score 0.41) | Matches "Panko Breaded Tilapia Fillets" ✅ |

With fuzzy matching:
- "filets" fuzzy-matches "fillets" (1 edit distance)
- Containment: 2/2 = 1.0 (both "tilapia" and "filets" match)
- Final score well above 0.45 threshold

### Performance Note
Fuzzy matching is O(n×m) per word pair, but the candidate word lists are typically very small (2-5 words), so the overhead is negligible.

