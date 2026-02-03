

## Quick Fix: Add Common Food-Action Verbs to Noise Filter

### Change

Add common food-action verbs to `HISTORY_REFERENCE_WORDS` in `src/lib/text-similarity.ts`.

### Words to Add

```typescript
// Food action verbs (never food items themselves)
'had', 'have', 'ate', 'eaten', 'eating', 'eat', 
'made', 'make', 'cooked', 'ordered', 'got', 'grabbed', 'picked'
```

### File to Modify

**`src/lib/text-similarity.ts`** - Lines 17-23, expand the `HISTORY_REFERENCE_WORDS` constant.

### Expected Result

| Input | Before | After |
|-------|--------|-------|
| "another tilapia like the one I had the other day" | `["tilapia", "had"]` → score 0.41 → **no match** | `["tilapia"]` → score 0.78 → **match** ✅ |

### Why This Is Safe

If we miss a noise word in the future, the worst case is a **false negative** (no match shown) — the user just types normally and gets AI analysis. That's far less annoying than a false positive suggesting the wrong food.

