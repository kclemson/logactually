

## Not a boundary issue — it's the description normalization

The calories are fine: 160 cal → bucket 22, 170 cal → bucket 22 (same bucket). The problem is the descriptions:

- `"Bacon Egg Cheese Pita"` → normalized: `"bacon egg cheese pita"`
- `"Bacon egg & cheese pita"` → normalized: `"bacon egg & cheese pita"`

The `&` isn't stripped by the current regex (which only removes parentheticals). So they produce different Map keys despite being the same food.

### Fix

On line 153, add punctuation stripping to the normalization — remove all non-alphanumeric, non-space characters:

```typescript
// Current:
const normDesc = item.description.toLowerCase().trim().replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

// New — also strip punctuation like &, commas, hyphens:
const normDesc = item.description.toLowerCase().trim().replace(/\s*\(.*?\)\s*/g, ' ').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
```

Adding `.replace(/[^\w\s]/g, ' ')` strips `&`, commas, hyphens, etc. so both descriptions become `"bacon egg cheese pita"` → same key → merged.

One regex added to line 153.

