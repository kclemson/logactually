

# Add "Active" Badge to Feedback Items (White Color)

## What changes
Add an "Active" label to feedback items that are unresolved and have no admin response yet. Use white/foreground color (`text-foreground`) for a subtle, clean look that distinguishes it from the blue "Response" and green/blue resolved badges without being visually loud.

## Status hierarchy
- **Active** (white/foreground) -- unresolved, no response yet
- **Response** (blue) -- unresolved, has admin response
- **Resolved** (blue) / **Resolved (Fixed)** (green) -- resolved

## Technical details

| File | Change |
|------|--------|
| `src/components/FeedbackForm.tsx` ~line 158 | Add a condition before the existing `item.response && !isResolved` check: when `!isResolved && !item.response`, render `<span className="text-xs text-foreground">Active</span>` |
| `src/pages/Admin.tsx` ~line 399 | In the open feedback section, add the same "Active" badge when `!f.response`: render `<span className="text-foreground">Active</span>` before the existing response indicator |

Two small additions, no new files or dependencies.
