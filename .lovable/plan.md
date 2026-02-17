

# Update calorie burn chart subtitle

## Change
One line change in `src/pages/Trends.tsx` (line 421):

**From:** `Total daily energy expenditure: ~1,497`
**To:** `Daily expenditure (excl. exercise): ~1,497`

This makes it immediately clear that the subtitle number does NOT include exercise calories, removing the potential confusion for users unfamiliar with TDEE terminology.

## File modified
- `src/pages/Trends.tsx` -- subtitle string update only

