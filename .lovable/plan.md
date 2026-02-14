
## "Change Portion" with +/- Stepper

### Concept

Instead of fraction chips, the portion text becomes tappable and reveals a compact **stepper control** inline below the item row:

```text
  [ - ]   0.5x   [ + ]        [Done]
```

- Tapping **+** or **-** steps through a sensible sequence
- The current multiplier is displayed between the buttons
- "Done" confirms (or tap outside to cancel)
- All macros update in real-time as a preview while stepping

### Step Sequence

Use quarter-portion jumps, clamped to a minimum of 0.25x:

```
0.25 -> 0.5 -> 0.75 -> 1.0 -> 1.25 -> 1.5 -> 1.75 -> 2.0 -> 2.5 -> 3.0 -> 4.0 -> 5.0
```

Below 2x: increments of 0.25. Above 2x: larger jumps (0.5, then 1.0). The minus button is disabled at 0.25x.

### Entry Point

- **Items with a portion**: Tapping the portion text (e.g., "(2 cups)") opens the stepper below that row
- **Items without a portion**: A "Change portion" link appears in the expanded entry section as a fallback

The portion `<span>` gets styled as a tappable element (subtle underline, `cursor-pointer`).

### What Happens on Confirm

1. All numeric nutritional fields scale proportionally (calories, protein, carbs, fat, fiber, sugar, saturated_fat, sodium, cholesterol)
2. Portion text updates best-effort: "2 cups" at 0.5x becomes "1 cup"; unparseable portions get "(x0.5)" appended
3. Saved via the existing `onUpdateItemBatch` callback

### Prompt Change

**File:** `supabase/functions/_shared/prompts.ts`, line 15 of `FOOD_ITEM_FIELDS`

**Before:**
```
- portion: the serving size mentioned or a reasonable default
```

**After:**
```
- portion: a simple "quantity unit" format (e.g., "1 slice", "2 cups", "100g", "1 medium banana"). Always use a single numeric quantity followed by a single unit. Never combine multiple units or add parenthetical context (avoid "15g (3 servings)" or "1 bar (65g)"). Put any clarifying details in source_note instead.
```

### Spacing Fix

**File:** `src/components/FoodItemsTable.tsx`, line 671

Change `py-1` to `pt-2 pb-1` on the expanded section div for more breathing room between the item row and the expanded content below it.

### Technical Details

**New file: `src/lib/portion-scaling.ts`**
- `MULTIPLIER_STEPS` array defining the step sequence
- `stepMultiplier(current, direction)` -- returns next/previous value in the sequence
- `scalePortion(portion, multiplier)` -- parses leading number/fraction, multiplies, reconstructs with basic pluralization; falls back to appending "(x0.5)" for unparseable text
- `scaleAllNutrients(item, multiplier)` -- returns scaled values for all numeric fields

**Modified: `src/components/FoodItemsTable.tsx`**
- Wrap portion `<span>` in a `<button>` (both editable and non-editable modes, lines 501-503 and 533-535)
- Add `portionScalingIndex` local state to track which item has the stepper open
- Render an inline stepper row below the active item: two small round buttons (- / +), multiplier display (e.g., "0.5x"), and a "Done" button
- On step change, preview scaled macros in the row above (temporary state, reverted on cancel)
- On Done, call `onUpdateItemBatch` with all scaled fields plus updated portion text

**Modified: `supabase/functions/_shared/prompts.ts`**
- Update portion instruction in `FOOD_ITEM_FIELDS` (single line change, propagates to all prompt variants)

No database changes needed.
