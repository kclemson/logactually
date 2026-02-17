

# Part 1: Add Delete Icon to Expanded Group Header

## What's Changing

Line 575 has `{hasDeleteColumn && <span></span>}` -- an empty placeholder in the expanded group header's delete column. The collapsed header (lines 396-426) has the full AlertDialog + Trash2 icon. The fix is simply replacing the empty span with the same AlertDialog block.

To your question about whether there's a shared codepath we could unify: no, the collapsed and expanded headers are two entirely separate `rows.push()` blocks. They share the same grid layout but render different content (collapsed shows a chevron + summary row; expanded shows an editable name + child items below). There's no wrapper component or conditional branch to simplify -- it's just a missing copy of the delete icon in the expanded variant. The fix is a straightforward copy of the AlertDialog block.

## Technical Details

### File: `src/components/FoodItemsTable.tsx`

**Line 575**: Replace `{hasDeleteColumn && <span></span>}` with the same AlertDialog block from lines 396-426 (Trash2 icon, confirmation dialog with group name and item count, calls `onDeleteEntry`).

---

# Part 2 Opinion: `portion_multiplier` on FoodItem

Honestly, I'd recommend **skipping this** for now. Here's why:

- **It adds a persistent tracking field to every food item** in the JSONB column, purely for a UI convenience (showing "Reset to 1x" on individual items). The group-level reset already works via `group_portion_multiplier` on the entry.
- **Individual item scaling is rare** compared to group scaling. Most users scale the whole group, not individual children. Singletons are even less likely to need a reset -- if you scaled a single item, you probably meant to.
- **It increases surface area for bugs**: every code path that touches food items (AI analysis, barcode lookup, photo logging, saved meals, CSV export, Apple Health import) now needs to be aware of this field. Even if it's optional, you'd want to strip or reset it in various places (e.g., when saving as a meal template).
- **The group-level "Reset to 1x" you just shipped covers the main use case** -- reversing a group scale that used non-step increments.

My recommendation: ship the expanded header delete icon fix, and defer `portion_multiplier` unless you find yourself actually wanting it in practice. It's a clean idea architecturally, but the cost/benefit doesn't justify it as a "nice to have."

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Replace empty `<span>` at line 575 with AlertDialog + Trash2 delete icon (same as collapsed header) |

