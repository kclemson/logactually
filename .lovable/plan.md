

## Make Preview Labels Fully Gray + Fix Toggle Overlap

### Change 1: Move toggle below header
The close X button overlaps the toggle. Move the toggle to its own row beneath the header area so they don't conflict.

### Change 2: Preview text all in muted/gray
Since the preview section is purely informational (nothing is editable), render the entire exercise line -- both name and details -- in smaller muted gray text (`text-xs text-muted-foreground`). This keeps the visual hierarchy clear: white text = interactive settings fields, gray text = read-only context.

### Technical Details (`src/components/CalorieBurnDialog.tsx`)

1. **Toggle layout** (~lines 163-176): Add a `DialogTitle` or simple heading for accessibility, then put the toggle row separately below it so the X button doesn't overlap.

2. **Preview list** (~lines 185-190): Change the exercise name `span` from `text-foreground` to `text-muted-foreground text-xs`, matching the calorie estimate styling on the right. Both sides of each row will be small gray text.

### Files Changed
- `src/components/CalorieBurnDialog.tsx` only

