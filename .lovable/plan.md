

# Inline Collapsible Multi-Item Mode in DetailDialog

## What changes

### DetailDialog: replace drill-down with inline collapsible sections

The current multi-item mode navigates away to a list, then drills into a separate view. Instead, multi-item mode will show all items as collapsible sections within the same dialog. Each section header shows the item's `description` -- the exact same text shown in the main table. No custom summary formatting, no divergence.

- Expanding a section reveals the read-only field grid (reusing existing view-mode markup)
- Each expanded section has an "Edit" button that switches just that section to edit mode inline
- Save returns that section to read-only; other sections remain unaffected
- Single-item mode is completely unchanged

### WeightLog gets multi-item support

Exercise entries from routines or comma-separated input produce multiple items sharing the same `entry_id`. These should use the same multi-item collapsible pattern, using the same `onShowDetails` signature update as food.

---

## Technical details

### `src/components/DetailDialog.tsx`

**State changes:**
- Replace `selectedIndex: number | null` with `expandedIndices: Set<number>` (which items are open, default: first item) and `editingIndex: number | null` (which item is in edit mode)
- Reset both on dialog close

**Multi-item rendering** (replaces the current list view at lines 180-200):

```text
items.map((item, idx) => {
  // Collapsible header: just item.description + chevron
  <button onClick={toggleExpanded(idx)}>
    <span>{item.description}</span>
    <ChevronDown rotated={!expanded} />
  </button>

  if expanded:
    if editingIndex === idx:
      // Reuse existing edit-mode grid (lines 210-256)
      + Save/Cancel buttons inline
    else:
      // Reuse existing view-mode grid (lines 258-271)
      + Edit button (unless readOnly)
})
```

**Footer:** In multi-item mode, no global Edit button -- each section has its own. Footer is hidden entirely.

**Key functions:**
- `toggleExpanded(idx)`: add/remove from `expandedIndices` set; if collapsing the item being edited, cancel edit
- `enterItemEdit(idx)`: set `editingIndex`, populate `draft` from `items[idx]`
- `cancelItemEdit()`: clear `editingIndex` and `draft`
- `saveItemEdit()`: compute diff, call `onSaveItem(editingIndex, updates)`, clear edit state (stay in dialog)

**Removed:** `ChevronLeft`, `ChevronRight` imports (no longer needed for navigation). Add `ChevronDown` import instead.

### `src/components/WeightItemsTable.tsx`

Update `onShowDetails` prop type and call to pass boundary range:

```typescript
// Prop type change (line 88):
onShowDetails?: (entryId: string, startIndex: number, endIndex?: number) => void;

// Call site change (lines 799-804):
onShowDetails(currentEntryId, boundary?.startIndex ?? index, boundary?.endIndex);
```

### `src/pages/WeightLog.tsx`

**State change** (line 74):

```typescript
const [detailDialogItem, setDetailDialogItem] = useState<
  | { mode: 'single'; index: number; entryId: string }
  | { mode: 'group'; startIndex: number; endIndex: number; entryId: string }
  | null
>(null);
```

**handleShowDetails** (line 345): detect multi vs single from boundary range

**handleDetailSaveItem** (new): for group mode, process per-item updates using existing `processExerciseSaveUpdates` + `flattenExerciseValues` pipeline, then call `updateSet.mutate`

**DetailDialog rendering** (lines 730-745): for group mode, pass `items` (slice of `displayItems` mapped through `flattenExerciseValues`), `buildFields={buildExerciseDetailFields}`, `onSaveItem={handleDetailSaveItem}`

### `src/pages/FoodLog.tsx`

No changes needed beyond what was already implemented in the previous round -- it already passes `items`, `buildFields`, and `onSaveItem`. It will automatically pick up the new collapsible rendering from DetailDialog.

## Files changed

| File | Change |
|------|--------|
| `src/components/DetailDialog.tsx` | Replace list/drill-down with inline collapsible sections per item; remove summaryForItem concept |
| `src/components/WeightItemsTable.tsx` | Pass boundary range in onShowDetails call |
| `src/pages/WeightLog.tsx` | Add multi-item support matching FoodLog pattern |

