

# Fix portion format in barcode lookup

## Problem
The `lookup-upc` function returns portions like "36 pretzels (56 g)" -- the dual-unit format that breaks the portion scaling parser. This happens in two places:

1. **Open Food Facts** returns `serving_size` as-is (e.g., "36 pretzels (56 g)")
2. **AI fallback** prompt doesn't enforce the simple "quantity unit" format

## Solution

### 1. Sanitize Open Food Facts `serving_size` (server-side)
Strip parenthetical context from the `serving_size` string before returning it. For example, "36 pretzels (56 g)" becomes "36 pretzels".

### 2. Update AI fallback prompt
Add the same portion format rule used in `analyze-food`: a simple "quantity unit" format -- never combine multiple units or add parenthetical context.

## Technical Details

**File: `supabase/functions/lookup-upc/index.ts`**

1. After extracting `servingSize` from Open Food Facts (around line 100), strip any parenthetical suffixes:
   ```typescript
   const servingSize = (product.serving_size || '1 serving')
     .replace(/\s*\([^)]*\)\s*/g, '')
     .trim() || '1 serving';
   ```

2. Update the AI prompt (around line 133) to enforce the portion format:
   ```
   "serving": "simple quantity-unit format like '1 bag' or '36 pretzels' -- 
    never combine multiple units or add parenthetical context"
   ```

No client-side changes needed.

