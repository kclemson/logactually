

## COMPLETED: Add Selection Mode with Full Context to Save Dialogs

### Summary
Implemented checkbox selection mode in `FoodItemsTable` and `WeightItemsTable` to display full item context in Save Meal/Routine dialogs instead of minimal text summaries.

### Changes Made

#### 1. FoodItemsTable - Selection Mode Added
**File:** `src/components/FoodItemsTable.tsx`
- Added props: `selectable`, `selectedIndices`, `onSelectionChange`
- Updated grid columns to include 24px checkbox column when `selectable=true`
- Added checkbox rendering in header, data rows, and totals row

#### 2. WeightItemsTable - Selection Mode Added  
**File:** `src/components/WeightItemsTable.tsx`
- Added props: `selectable`, `selectedIndices`, `onSelectionChange`, `compact`
- Updated grid columns to include 24px checkbox column when `selectable=true`
- Added checkbox rendering in header, data rows, and totals row
- Added `compact` text styling for description cells

#### 3. SaveMealDialog Updated
**File:** `src/components/SaveMealDialog.tsx`
- Replaced checkbox+text labels with `FoodItemsTable` instances
- Each "other entry" now shows full nutritional context (calories, macros)
- Selection toggles entire entry (all-or-nothing)
- Uses `compact=true`, `showTotals=true`, `showInlineLabels=true`

#### 4. SaveRoutineDialog Updated
**File:** `src/components/SaveRoutineDialog.tsx`
- Added `weightUnit` prop for proper weight display
- Replaced checkbox+text labels with `WeightItemsTable` instances
- Each "other entry" now shows full exercise context (sets, reps, weight)
- Uses `compact=true`, `showTotals=false`, `showInlineLabels=true`

#### 5. WeightLog.tsx Updated
**File:** `src/pages/WeightLog.tsx`
- Passes `weightUnit={settings.weightUnit}` to SaveRoutineDialog

### Visual Design
- Checkbox column: 24px width, leftmost position
- Tables wrapped in subtle border for visual grouping
- Compact mode reduces text size for better fit in dialog context
- "Show X more..." collapse behavior preserved
