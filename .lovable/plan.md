

## Plan: Add Selection Mode with Full Context to Save Dialogs

### The Problem
The "Add more from today" section in Save Meal/Routine dialogs currently shows minimal text like "Egg, +5 more", losing important context (calories, macros, sets/reps/weight) that users need when deciding whether to include an entry.

The "you've logged this X times before" prompt already shows full table details. We want that same experience in the dialogs, but with checkboxes for entry selection.

---

### Solution Overview

Add an optional **selection mode** to both `FoodItemsTable` and `WeightItemsTable` that:
1. Adds a leftmost checkbox column (same width as delete column: 24px)
2. Allows controlled selection via props
3. Works in read-only mode (no editing, just viewing + selecting)

Then update the Save dialogs to use these tables instead of the simple text summaries.

---

### Technical Changes

#### 1. FoodItemsTable - Add Selection Props

**File:** `src/components/FoodItemsTable.tsx`

New props:
- `selectable?: boolean` - enables checkbox column on the left
- `selectedIndices?: Set<number>` - which row indices are currently selected  
- `onSelectionChange?: (index: number, selected: boolean) => void` - callback when a checkbox is toggled

Grid column adjustment when `selectable` is true:
```
// Without delete column
'grid-cols-[24px_1fr_50px_90px]'   // checkbox + desc + cal + P/C/F

// With delete column (unlikely in this context)
'grid-cols-[24px_1fr_50px_90px_24px]'
```

Checkbox rendering: Add a leftmost column with a checkbox for each data row. The checkbox uses the same styling as the existing checkboxes in the dialogs (`h-4 w-4 rounded border-input`).

#### 2. WeightItemsTable - Add Selection Props

**File:** `src/components/WeightItemsTable.tsx`

Same pattern as FoodItemsTable:
- `selectable?: boolean`
- `selectedIndices?: Set<number>`  
- `onSelectionChange?: (index: number, selected: boolean) => void`

Grid column adjustment:
```
// Without delete column
'grid-cols-[24px_1fr_45px_45px_60px]'   // checkbox + desc + sets + reps + weight

// With delete column
'grid-cols-[24px_1fr_45px_45px_60px_24px]'
```

#### 3. Update SaveMealDialog

**File:** `src/components/SaveMealDialog.tsx`

Replace the current checkbox + text label pattern:
```tsx
// Current approach (loses context)
<label className="flex items-start gap-2 ...">
  <input type="checkbox" ... />
  <span>{formatEntryPreview(entry.items)}</span>
</label>
```

With full table per entry:
```tsx
<FoodItemsTable
  items={entry.items}
  editable={false}
  selectable={true}
  selectedIndices={/* all indices if entry is selected, empty set otherwise */}
  onSelectionChange={() => toggleEntry(entry.entryId)}
  showHeader={false}
  showTotals={true}
  totalsPosition="bottom"
  compact={true}
  showInlineLabels={true}
  showMacroPercentages={false}
  showTotalsDivider={false}
/>
```

**Selection behavior:** Clicking any checkbox in an entry toggles the entire entry (all-or-nothing per entry). This is simpler than per-item selection and matches the existing mental model.

The table will need temporary `uid` fields for the items (like `SimilarEntryPrompt` does).

#### 4. Update SaveRoutineDialog

**File:** `src/components/SaveRoutineDialog.tsx`

Same pattern - replace checkbox + text with full table:
```tsx
<WeightItemsTable
  items={entry.exerciseSets.map((e, i) => ({ 
    ...e, 
    uid: `other-${entry.entryId}-${i}` 
  }))}
  editable={false}
  selectable={true}
  selectedIndices={/* all if selected */}
  onSelectionChange={() => toggleEntry(entry.entryId)}
  showHeader={false}
  showTotals={false}
  weightUnit={/* will need to accept as prop */}
/>
```

Note: `SaveRoutineDialog` will need a new `weightUnit` prop to pass to the table for proper weight display.

---

### Visual Design

**Checkbox column:**
- Leftmost position in the grid
- Width: 24px (same as delete column)
- Checkbox: `h-4 w-4 rounded border-input` (consistent with existing dialogs)
- Vertically centered with row content

**Entry grouping:**
- Each entry from "Add more from today" gets its own table instance
- Visual separation between entries (existing `space-y-2` in the dialog)
- Tables use `compact={true}` for smaller text to fit more content

**Totals row:**
- Food tables: show totals with calories and macros (helps user see nutritional summary)
- Weight tables: `showTotals={false}` to avoid confusion

---

### Files Modified

| File | Changes |
|------|---------|
| `src/components/FoodItemsTable.tsx` | Add `selectable`, `selectedIndices`, `onSelectionChange` props; add checkbox column logic |
| `src/components/WeightItemsTable.tsx` | Add `selectable`, `selectedIndices`, `onSelectionChange` props; add checkbox column logic |
| `src/components/SaveMealDialog.tsx` | Import `FoodItemsTable`, replace checkbox+text with full tables |
| `src/components/SaveRoutineDialog.tsx` | Import `WeightItemsTable`, replace checkbox+text with full tables, add `weightUnit` prop |

---

### Edge Cases Handled

1. **All-or-nothing entry selection** - Clicking any checkbox toggles entire entry, not individual items
2. **Compact mode** - Tables use existing `compact` prop for reduced text size in dialog context
3. **No header in nested tables** - `showHeader={false}` since the dialog already has section labels
4. **Show/hide expansion** - Keep the "Show X more..." collapse behavior for long entry lists
5. **Weight unit preference** - Pass through user's weight unit setting to routine dialog
6. **No editing in selection mode** - Tables are read-only (`editable={false}`) when used for selection

