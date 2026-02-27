

## Analysis: Bucketing vs Linear Scan

You're right to reconsider. The Map/key constraint is real, and linear scan over the full candidate list on every new item is unnecessary complexity for what's essentially a dedup pass.

**Logarithmic bucketing** is actually the clean solution here — it naturally produces percentage-based grouping without the awkward `step` calculation:

```typescript
const calBucket = item.calories <= 0 ? 0 : Math.round(Math.log2(item.calories) * 3);
```

Each bucket boundary is ~26% apart (2^(1/3) ≈ 1.26), so items within roughly 25% of each other land in the same bucket. No step math, no linear scan, just a Map key.

- 2 cal → bucket 3, 5 cal → bucket 7... these are close but won't merge (they're 150% apart — genuinely different)
- 5 cal → bucket 7, 8 cal → bucket 9... also won't merge
- 100 cal → bucket 20, 115 cal → bucket 21... might not merge

Hmm — the boundary problem still exists. Two items at 99 and 101 calories could land in different buckets.

**Practical take:** For typeahead dedup, boundary edge cases are rare and low-impact (worst case: you see two nearly-identical suggestions instead of one). The `step`-based approach from before had the same boundary issue. Both are "good enough."

### Recommendation

Use logarithmic bucketing — it's one line, O(1) per item, percentage-based by nature, and the boundary edge case is acceptable for a suggestion list. Combined with parenthetical stripping on the description, it covers the cases you showed.

### Plan

In `src/pages/FoodLog.tsx`, update the individual-item dedup key (~line 153):

```typescript
// Current:
const key = `item:${item.description.toLowerCase().trim()}`;

// New:
const normDesc = item.description.toLowerCase().trim().replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
const calBucket = item.calories <= 0 ? 0 : Math.round(Math.log2(item.calories) * 3);
const key = `item:${normDesc}:${calBucket}`;
```

One import-free change, ~3 lines modified.

