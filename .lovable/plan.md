

## Reduce Expanded Section Font Size to Match Cardio Row Summary

### What changes

The expanded detail section (cardio stats, calorie estimates, "Logged as", "Save as routine") currently uses `text-sm` (~14px desktop / 16px mobile). The cardio summary shown inline in the row uses `text-xs` (~12px / ~14px mobile). This change aligns them so the expanded section feels like secondary detail rather than competing with the main row text.

### Tappability on mobile

The "Save as routine" link-style button and the "From saved routine" link will remain tappable. At `text-xs`, the text is still ~14px on mobile (due to the 16px base). The elements already have default line-height which provides adequate vertical tap area. No extra padding changes are needed.

### Technical Details

**`src/components/WeightItemsTable.tsx`** -- 5 class changes in the expanded section (lines 782, 811, 819, 825, 845):

1. **Cardio metadata** (line 782): `text-sm` to `text-xs`
2. **Calorie burn estimate** (line 811): `text-sm` to `text-xs`
3. **"Logged as" raw input** (line 819): `text-sm` to `text-xs`
4. **"From saved routine" text** (line 825): `text-sm` to `text-xs`
5. **"Save as routine" button** (line 845): `text-sm` to `text-xs`

All other styles (italic, colors, hover/underline on links) remain unchanged.

### Files Changed
- `src/components/WeightItemsTable.tsx` -- change 5 instances of `text-sm` to `text-xs` in the expanded content section
