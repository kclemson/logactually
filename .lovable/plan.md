
# Update calorie burn chart subtitle

## Change
One line change in `src/pages/Trends.tsx` (line 421):

**From:** `Daily expenditure (excl. exercise): ~1,497`
**To:** `TDEE (excluding exercise): ~1,497`

Shorter label fits on one line on mobile, and the tooltip already explains what TDEE means via the "show the math" equation.

## File modified
- `src/pages/Trends.tsx` -- subtitle string only
