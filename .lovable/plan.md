

## Reduce Font Size in AI Response Area

### Change

**File:** `src/components/AskTrendsAIDialog.tsx` (around line 155)

Change the response container's text class from `text-sm` to `text-xs` and tighten the leading from `leading-relaxed` to `leading-snug`. This matches the compact styling used elsewhere in the app for read-only content.

Single line change on the response `div`:
- `text-sm ... leading-relaxed` becomes `text-xs ... leading-snug`

This will noticeably reduce the text size and line spacing, making more content visible without scrolling while remaining legible for read-only output.

