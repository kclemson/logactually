
## Reduce Dialog Padding in Ask AI Dialog

### Change

**File:** `src/components/AskTrendsAIDialog.tsx`

Two tweaks:

1. **Line 89** - Reduce `DialogContent` padding from `p-4` (16px) to `p-3` (12px)
2. **Line 179** - Reduce the response area's inner padding from `p-3` (12px) to `p-2` (8px)

This reclaims roughly 16px of horizontal space total, giving the response text more room and reducing the chance of needing a scrollbar.
