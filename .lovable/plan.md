
## Fix: Short names in lookup-upc

Two targeted changes to `supabase/functions/lookup-upc/index.ts` only. No changes to `prompts.ts`, `analyze-food`, or any other file.

---

### Change 1: Word-boundary truncation for Open Food Facts names

Open Food Facts returns raw database strings like "Old-Fashioned Vanilla Farmstyle Greek Blended Lowfat Yogurt". No prompt can fix this — it's not going through an AI. A small helper trims at the last word boundary before 45 characters:

```typescript
function truncateProductName(name: string, maxChars = 45): string {
  if (name.length <= maxChars) return name;
  const truncated = name.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 15 ? truncated.slice(0, lastSpace) : truncated;
}
```

Applied in two places:
- Line ~104: `const productName = truncateProductName(product.product_name || 'Unknown product');`
- Line ~183 (EAN-13 retry): same

**Examples:**

| Raw OFF name | After truncation |
|---|---|
| Old-Fashioned Vanilla Farmstyle Greek Blended Lowfat Yogurt (59) | "Old-Fashioned Vanilla Farmstyle Greek" (37) |
| GOLD STANDARD 100% WHEY Double Rich Chocolate (46) | "GOLD STANDARD 100% WHEY Double Rich" (35) |
| Greek Yogurt (12) | "Greek Yogurt" (unchanged) |
| Bacon Egg & Cheese Sandwich (28) | "Bacon Egg & Cheese Sandwich" (unchanged) |

---

### Change 2: Add max-length instruction to the AI fallback prompt

The current prompt says `"name": "Product Name"` — no length guidance at all. Change it to match the same instruction already used in `analyze-food`:

```
// Before
{"name": "Product Name", "serving": ...}

// After
{"name": "Short product name, max 25 characters", "serving": ...}
```

That's it — same phrasing as `FOOD_ITEM_FIELDS` already uses, just inlined into the `lookup-upc` prompt.

---

### Files changed

| File | Change |
|---|---|
| `supabase/functions/lookup-upc/index.ts` | Add `truncateProductName()` helper; apply to OFF product names in both lookup paths; update AI prompt `name` field description to "Short product name, max 25 characters" |
