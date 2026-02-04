

## Add Recency Tiebreaker to Similar Entry Matching

### Problem
When scores are very close (e.g., 0.80 vs 0.775), the algorithm picks the slightly higher score even if it's from an older entry. For generic inputs like "chicken", this means older entries can win over more recent ones.

### Solution
When two entries have similarity scores within a small tolerance (0.05), prefer the more recent entry.

### Change

**File: `src/lib/text-similarity.ts`**

Update the comparison logic in `findSimilarEntry` (lines 284 and 291) to use a helper function that considers recency when scores are close.

```typescript
// Helper: returns true if candidate should replace current best
function isBetterMatch(
  candidateScore: number,
  candidateDate: string,
  bestScore: number,
  bestDate: string,
  tolerance = 0.05
): boolean {
  const scoreDiff = candidateScore - bestScore;
  
  // Clear winner by score
  if (scoreDiff > tolerance) return true;
  if (scoreDiff < -tolerance) return false;
  
  // Scores within tolerance → prefer more recent
  return new Date(candidateDate) > new Date(bestDate);
}
```

Then update the two comparison points:
- Line 284: Replace `itemsScore > bestMatch.score` with the new helper
- Line 291: Replace `rawScore > bestMatch.score` with the new helper

### Expected Result

| Input | Before | After |
|-------|--------|-------|
| "another chicken like the other day" | Matches "Chicken Corn Chowder" (Jan 29, score 0.80) | Matches "Grilled chicken marinara" (Feb 1, score 0.775) ✅ |

The 0.025 score difference is within tolerance, so recency wins.

