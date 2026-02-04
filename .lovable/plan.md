
## Fix History Reference Detection for "another [food]" Pattern

### Problem
- "another tilapia fillet" doesn't trigger the similar entry feature at all
- The pronoun "i" pollutes candidate food words in first-person inputs

### Changes

**File: `src/lib/text-similarity.ts`**

1. Add "i" to STOP_WORDS (line ~7):
```typescript
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'with', 'of', 'from', 'and', 'at', 'in', 'on', 'for',
  'to', 'my', 'some', 'like', 'about', 'around', 'i'  // ← add 'i'
]);
```

**File: `src/lib/history-patterns.ts`**

2. Update the "another" pattern to match "another [food]" directly (not just "another one/of"):
   - Current: requires explicit "another one" or "another of the X"
   - Fix: match "another" followed by any word that isn't a stop word

### Result
- "another tilapia fillet" will now trigger history reference detection
- First-person inputs won't have "i" polluting the similarity calculation
