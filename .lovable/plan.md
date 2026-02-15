
# Fix: "Edit Reply" should expand the feedback item

## Problem
Clicking "Edit Reply" (or "Reply") sets the reply form state but doesn't expand the collapsed item, so the reply textarea is hidden.

## Solution
In `handleStartReply` (line 79-82 of `src/pages/Admin.tsx`), also add the feedback ID to `expandedFeedbackIds` so the item expands and the reply form becomes visible.

## Technical details

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` line 79-82 | In `handleStartReply`, add the feedback ID to `expandedFeedbackIds` using `setExpandedFeedbackIds(prev => new Set(prev).add(feedbackId))` |

This is a one-line addition inside the existing function.
