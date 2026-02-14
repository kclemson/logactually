

## Fix Missing Space Between Description and Portion

The portion button already contains a leading space character (` ({item.portion})`), but it appears to be collapsed in rendering. The fix is to add a small left margin to the portion button in both editable and read-only code paths.

### Changes

**File: `src/components/FoodItemsTable.tsx`**

- **Line 515** (editable mode): Add `ml-1` to the button className
- **Line 555** (read-only mode): Add `ml-1` to the button className

This adds a consistent 4px gap between the description text and the portion, matching the original spacing before the portion scaling feature was added.

