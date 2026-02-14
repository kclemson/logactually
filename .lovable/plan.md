

## Portion Scaling UI Tweaks

Two changes in `src/components/FoodItemsTable.tsx`:

### 1. Remove dotted underline from portion text

Remove `underline decoration-dotted underline-offset-2` from the portion button classes in both the editable and read-only rendering paths (lines 515 and 555). The portion text will still be a clickable button with hover color change, just without the visual underline decoration.

### 2. Move scaled preview next to Done button

Currently the parenthesized preview (e.g. "(1.3 kid's sizes, 100 cal)") is right-aligned because of a `flex-1` spacer div on line 739. Remove that spacer so the preview sits immediately after the Done button in normal flex flow.

### Technical Details

**File: `src/components/FoodItemsTable.tsx`**

- **Line 515**: Remove `underline decoration-dotted underline-offset-2` from className (editable mode portion button)
- **Line 555**: Remove `underline decoration-dotted underline-offset-2` from className (read-only mode portion button)
- **Line 739**: Remove `<div className="flex-1" />` spacer so the scaled preview flows directly after the Done button
