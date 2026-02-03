

## Fix: Hybrid Matching with Containment Primary + Jaccard Ranking

### Problem

User input like "another tilapia like from yesterday" fails to match "Panko Breaded Tilapia Fillets" because:

1. **Similarity dilution**: Words like "yesterday", "another", "from" dilute the match score
2. **Jaccard penalizes short inputs**: "tilapia" vs "panko breaded tilapia fillets" = 1/4 = 0.25 (below thresholds)
3. **Scanned entries have unusable raw_input**: Entries from barcode scans start with "Scanned:" followed by the barcode number

---

### Solution: Hybrid Matching Strategy

**Phase 1: Noise Filtering**
Strip history-reference words before comparing to isolate candidate food words.

**Phase 2: Containment for Threshold**
Use word containment (`|input ∩ target| / |input|`) to determine if an entry is a viable match.

**Phase 3: Jaccard for Ranking**
When multiple entries pass the containment threshold, use Jaccard to pick the best one (prefers entries that don't have lots of extra words).

**Combined Score Formula:**
```
finalScore = (containmentScore * 0.7) + (jaccardScore * 0.3)
```

---

### Why Hybrid Works Better

| Scenario | Containment Only | Jaccard Only | Hybrid |
|----------|------------------|--------------|--------|
| "tilapia" → "Panko Breaded Tilapia Fillets" | 1.0 ✅ | 0.25 ❌ | 0.78 ✅ |
| "chicken" → "Chicken Breast" vs "Chicken Thigh with Rice" | Both 1.0 (tie) | 0.5 vs 0.2 | 0.85 vs 0.76 (correct winner) |
| "tilapia salmon" → "Tilapia Fillets" | 0.5 | 0.33 | 0.45 |
| "chicken salad" → "Tilapia Fillets" | 0.0 ❌ | 0.0 ❌ | 0.0 ❌ |

---

### File Changes

**`src/lib/text-similarity.ts`**

#### 1. Add History Reference Words Constant

```typescript
// Words that trigger history patterns but aren't food-related
const HISTORY_REFERENCE_WORDS = new Set([
  // Time references
  'yesterday', 'yesterdays', 'today', 'monday', 'tuesday', 'wednesday', 
  'thursday', 'friday', 'saturday', 'sunday', 'earlier', 'recently', 
  'recent', 'before', 'last', 'week', 'night', 'morning', 'evening',
  'afternoon', 'time', 'day', 'days', 'ago', 'while',
  
  // Portion/repetition signals  
  'another', 'more', 'same', 'again', 'repeat', 'leftover', 'leftovers', 
  'remaining', 'finished', 'rest', 'half', 'other', 'those', 'that',
  'thing', 'one', 'ones',
  
  // Meal references
  'breakfast', 'lunch', 'dinner', 'brunch', 'meal', 'snack',
]);
```

#### 2. Add `extractCandidateFoodWords` Function

```typescript
/**
 * Extract candidate food words by removing known noise (history references, stop words).
 * Returns words that MIGHT be food-related - we can't verify they're actual foods,
 * but we've filtered out words we know AREN'T foods.
 * 
 * "another tilapia like from yesterday" → ["tilapia"]
 */
export function extractCandidateFoodWords(text: string): string[] {
  let result = text.toLowerCase();
  
  // Expand abbreviations (same processing as preprocessText)
  for (const [abbr, full] of Object.entries(MULTI_WORD_ABBREVIATIONS)) {
    result = result.replace(new RegExp(escapeRegex(abbr), 'gi'), full);
  }
  result = result.replace(/[^\w\s]/g, ' ');
  for (const [abbr, full] of Object.entries(SINGLE_WORD_ABBREVIATIONS)) {
    result = result.replace(new RegExp(`\\b${escapeRegex(abbr)}\\b`, 'gi'), full);
  }
  
  // Remove numbers
  result = result.replace(/\d+/g, '');
  
  // Filter stop words AND history reference words
  return result.split(/\s+/).filter(w => 
    w && !STOP_WORDS.has(w) && !HISTORY_REFERENCE_WORDS.has(w)
  );
}
```

#### 3. Add `wordContainmentScore` Function

```typescript
/**
 * Calculate what fraction of input words are found in target text.
 * Uses word-boundary matching (not substring).
 * 
 * ["tilapia"] in "panko breaded tilapia fillets" → 1.0
 * ["tilapia", "rice"] in "panko breaded tilapia fillets" → 0.5
 */
export function wordContainmentScore(inputWords: string[], targetText: string): number {
  if (inputWords.length === 0) return 0;
  
  const targetWords = new Set(
    targetText.toLowerCase().split(/\s+/).filter(Boolean)
  );
  
  let matchedCount = 0;
  for (const word of inputWords) {
    if (targetWords.has(word)) {
      matchedCount++;
    }
  }
  
  return matchedCount / inputWords.length;
}
```

#### 4. Add `hybridSimilarityScore` Function

```typescript
/**
 * Calculate hybrid similarity score combining containment and Jaccard.
 * Containment is weighted higher (0.7) for threshold matching.
 * Jaccard (0.3) helps rank between multiple viable matches.
 */
export function hybridSimilarityScore(
  candidateFoodWords: string[], 
  targetText: string
): number {
  if (candidateFoodWords.length === 0) return 0;
  
  const targetWords = targetText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w && !STOP_WORDS.has(w));
  
  const inputSet = new Set(candidateFoodWords);
  const targetSet = new Set(targetWords);
  
  // Containment: what fraction of input words appear in target
  let matchedCount = 0;
  for (const word of candidateFoodWords) {
    if (targetSet.has(word)) matchedCount++;
  }
  const containment = matchedCount / candidateFoodWords.length;
  
  // Jaccard: intersection over union (for ranking)
  const intersection = new Set([...inputSet].filter(x => targetSet.has(x)));
  const union = new Set([...inputSet, ...targetSet]);
  const jaccard = union.size > 0 ? intersection.size / union.size : 0;
  
  // Weighted combination
  return (containment * 0.7) + (jaccard * 0.3);
}
```

#### 5. Update `findSimilarEntry` Function

```typescript
export function findSimilarEntry(
  inputText: string,
  recentEntries: FoodEntry[],
  minSimilarityRequired: number
): SimilarEntryMatch | null {
  // Extract only candidate food words (strips "yesterday", "another", etc.)
  const candidateFoodWords = extractCandidateFoodWords(inputText);
  
  // If no candidate food words remain, can't match
  if (candidateFoodWords.length === 0) return null;
  
  let bestMatch: SimilarEntryMatch | null = null;
  
  for (const entry of recentEntries) {
    // Build combined description from all food items
    const itemsDescription = entry.food_items
      .map(item => item.description)
      .join(' ');
    
    // Calculate hybrid score against food items
    const itemsScore = hybridSimilarityScore(candidateFoodWords, itemsDescription);
    
    if (itemsScore >= minSimilarityRequired && (!bestMatch || itemsScore > bestMatch.score)) {
      bestMatch = { entry, score: itemsScore, matchType: 'items' };
    }
    
    // Also check raw_input (skip scanned entries - their raw_input is just barcodes)
    if (entry.raw_input && !entry.raw_input.startsWith('Scanned:')) {
      const rawScore = hybridSimilarityScore(candidateFoodWords, entry.raw_input);
      if (rawScore >= minSimilarityRequired && (!bestMatch || rawScore > bestMatch.score)) {
        bestMatch = { entry, score: rawScore, matchType: 'input' };
      }
    }
  }
  
  return bestMatch;
}
```

---

### Expected Results

| User Input | Candidate Words | Entry | Hybrid Score | Threshold | Result |
|------------|-----------------|-------|--------------|-----------|--------|
| "another tilapia from yesterday" | ["tilapia"] | "Panko Breaded Tilapia Fillets" | 0.78 | 0.35 | Match |
| "more of those tilapia" | ["tilapia"] | "Panko Breaded Tilapia Fillets" | 0.78 | 0.45 | Match |
| "chicken" | ["chicken"] | "Chicken Breast" | 0.85 | 0.35 | Match |
| "chicken" | ["chicken"] | "Chicken Thigh with Rice and Veg" | 0.76 | 0.35 | Match (but loses to above) |
| "tilapia and rice" | ["tilapia", "rice"] | "Panko Breaded Tilapia Fillets" | 0.45 | 0.45 | Match |
| "chicken salad" | ["chicken", "salad"] | "Tilapia Fillets" | 0.0 | 0.35 | No Match |

---

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| All words filtered out ("same thing again") | Returns `null` → falls through to AI analysis |
| Scanned entry with "Scanned: 012345" raw_input | Skips raw_input, uses food_items descriptions only |
| Multiple viable matches | Jaccard component helps pick tighter match |
| No matching entries | Returns `null` → falls through to AI analysis |

---

### Limitations Acknowledged

These cases still won't match and will fall through to AI:

| Case | Why | Acceptable? |
|------|-----|-------------|
| Synonyms ("pasta" vs "spaghetti") | Different words | Yes - AI handles |
| "same thing again" (no food words) | All words stripped | Yes - returns null |
| Typos ("tillapia" vs "tilapia") | Exact match required | Future: add fuzzy matching |

---

### Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `src/lib/text-similarity.ts` | Add `HISTORY_REFERENCE_WORDS` constant | Define noise words to filter |
| `src/lib/text-similarity.ts` | Add `extractCandidateFoodWords()` | Strip noise, keep potential food words |
| `src/lib/text-similarity.ts` | Add `wordContainmentScore()` | Calculate input word coverage |
| `src/lib/text-similarity.ts` | Add `hybridSimilarityScore()` | Combine containment + Jaccard |
| `src/lib/text-similarity.ts` | Update `findSimilarEntry()` | Use hybrid matching strategy |

