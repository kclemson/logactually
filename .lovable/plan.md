

## Plan: Single-Table Save Dialogs with Per-Item Selection

### Problem Summary
Current implementation creates separate table instances for each entry, causing:
- Repeated column headers (Cal / P/C/F) per entry
- Repeated total rows per entry
- All-or-nothing entry selection (can't pick individual items)

### Solution Overview
Render ONE table containing ALL items from the day:
- Items from the clicked entry are pre-selected
- Per-item checkbox selection
- Single header at top
- Single totals row (showing selected items only)
- "Show first 5, expand to see all" for height control

### Visual Change

```text
BEFORE:                              AFTER:
┌─────────────────────────┐          ┌─────────────────────────┐
│ Items (2):              │          │ Meal name: [input]      │
│ • Cheese pizza          │          ├─────────────────────────┤
│ • Diet coke             │          │ ☑ Cheese pizza    320cal│
├─────────────────────────┤          │ ☑ Diet coke         0cal│
│ Add more from today:    │          │ ☐ Eggs & bacon    450cal│
├─────────────────────────┤          │ ☐ Coffee           15cal│
│ Cal  P/C/F  ← repeated  │          │   Show 2 more...        │
│ ☐ Eggs & bacon          │          ├─────────────────────────┤
│ ☐ Coffee                │          │ Total: 320cal (selected)│
│ Total: 465    ← per-entry│         └─────────────────────────┘
├─────────────────────────┤
│ Cal  P/C/F  ← repeated  │
│ ☐ Protein shake         │
│ Total: 180    ← per-entry│
└─────────────────────────┘
```

### Technical Changes

#### 1. SaveMealDialog.tsx

**State changes:**
```tsx
// Remove: entry-level selection
const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());

// Add: item-level selection (pre-select primary entry items)
const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() => 
  new Set(foodItems.map((_, i) => i))
);
```

**Combine items for display (presentation only):**
```tsx
const allItems = useMemo(() => {
  const items = [...foodItems];
  otherEntries?.forEach(entry => items.push(...entry.items));
  return items.map((item, i) => ({ ...item, uid: `combined-${i}` }));
}, [foodItems, otherEntries]);
```

**Collapse/expand:**
```tsx
const INITIAL_VISIBLE_COUNT = 5;
const [showAllItems, setShowAllItems] = useState(false);
const visibleItems = showAllItems ? allItems : allItems.slice(0, INITIAL_VISIBLE_COUNT);
```

**Single table render:**
```tsx
<FoodItemsTable
  items={visibleItems}
  editable={false}
  selectable={true}
  selectedIndices={selectedIndices}
  onSelectionChange={(index, selected) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      selected ? next.add(index) : next.delete(index);
      return next;
    });
  }}
  showHeader={true}
  showTotals={true}
  compact={true}
/>
```

**API signature change:**
```tsx
// Before: parent had to resolve entry IDs to items
onSave: (name: string, additionalEntryIds?: string[]) => void

// After: dialog returns exactly what to save
onSave: (name: string, selectedItems: FoodItem[]) => void
```

#### 2. SaveRoutineDialog.tsx

Same pattern applied:
- Flatten all exercises into one array
- Pre-select exercises from clicked entry
- Per-exercise checkbox selection
- Single `WeightItemsTable` with single header

#### 3. FoodLog.tsx

Update handler to receive items directly:
```tsx
// Before
const handleSaveMealConfirm = (name: string, additionalEntryIds: string[] = []) => {
  let allItems = [...saveMealDialogData.foodItems];
  for (const entryId of additionalEntryIds) {
    const entry = entries.find(e => e.id === entryId);
    if (entry) allItems.push(...entry.food_items);
  }
  saveMeal.mutate({ name, foodItems: allItems });
};

// After
const handleSaveMealConfirm = (name: string, selectedItems: FoodItem[]) => {
  saveMeal.mutate({ name, foodItems: selectedItems });
};
```

#### 4. WeightLog.tsx

Same handler simplification for routines.

### Files Modified

| File | Changes |
|------|---------|
| `src/components/SaveMealDialog.tsx` | Single table, per-item selection, new onSave signature |
| `src/components/SaveRoutineDialog.tsx` | Same pattern for routines |
| `src/pages/FoodLog.tsx` | Simplify handler to receive items directly |
| `src/pages/WeightLog.tsx` | Simplify handler to receive items directly |

### Benefits

| Aspect | Before | After |
|--------|--------|-------|
| Table instances | N (one per entry) | 1 |
| Column headers | Repeated N times | Once |
| Total rows | N (per entry) | 1 (selected items) |
| Selection | Per-entry (all or nothing) | Per-item |
| Parent logic | Resolve entry IDs → items | Receive items directly |

### Edge Cases Handled

- **Empty selection**: Disable Save button when no items selected
- **Primary items deselected**: Allowed - user might only want items from other entries
- **Height control**: Show first 5 items, "Show N more" expands

