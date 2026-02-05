

## Risk Analysis & Refined Plan: "Add More From Today" Feature

### Risk Assessment

I reviewed the current implementation and identified **3 potential regression vectors**:

---

#### Risk 1: Changing `onSave` Callback Signature ⚠️ MEDIUM

**Original plan**: Change `onSave(name: string)` → `onSave(name: string, combinedItems: FoodItem[])`

**Why risky**: The parent component (`FoodLog.tsx` / `WeightLog.tsx`) already has the items in `saveMealDialogData`. If we change the callback signature, we need to ensure:
- The parent handler ignores items it didn't expect before
- No other code path calls `onSave` with different assumptions

**Mitigation**: Instead of changing the callback signature, pass the **selected entry IDs** back and let the parent combine items. This keeps the dialog's responsibility limited to "which entries to include" rather than "here's the final item list."

**Better approach**: 
```typescript
// Dialog tells parent which extra entries to include
onSave(name: string, additionalEntryIds: string[])

// Parent does the combining (already has access to all entries)
```

---

#### Risk 2: Date Filtering Logic Correctness ⚠️ LOW

**What we're doing**: Filtering `entries` to find same-day entries

**Why low risk**: Both pages already have a `dateStr` derived from the URL that's stable for the component instance. We can use simple string equality rather than complex date parsing:
```typescript
// entries is already filtered to the current date by the useFoodEntries(dateStr) hook
const otherEntries = entries.filter(e => e.id !== currentEntryId);
```

**Mitigation**: No complex date filtering needed - `entries` is already scoped to the day.

---

#### Risk 3: State Persistence on Dialog Close/Reopen ⚠️ LOW

**Current behavior**: Dialogs unmount when closed (React pattern), so state resets naturally.

**Our changes**: Adding `otherEntries` prop (computed from parent) and internal `selectedEntryIds` state.

**Why safe**: 
- `otherEntries` is computed fresh when dialog opens
- `selectedEntryIds` resets on mount (dialog remounts each open)
- No effects or syncing needed

---

### Refined Implementation Plan

#### Summary of Changes

| File | What Changes |
|------|--------------|
| `SaveMealDialog.tsx` | Add `otherEntries` prop, checkbox UI, `selectedEntryIds` state |
| `SaveRoutineDialog.tsx` | Same pattern |
| `FoodLog.tsx` | Compute `otherEntries`, update dialog state type, update confirm handler |
| `WeightLog.tsx` | Same pattern |

#### 1. Update `SaveMealDialog.tsx`

**New props:**
```typescript
interface OtherEntry {
  entryId: string;
  items: FoodItem[];
  rawInput: string | null;
}

interface SaveMealDialogProps {
  // ... existing props unchanged
  otherEntries?: OtherEntry[];  // New - entries from same day to optionally include
}
```

**New internal state:**
```typescript
const [showAllEntries, setShowAllEntries] = useState(false);
const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
```

**Updated `onSave` call:**
```typescript
// Current: onSave(trimmed)
// New: also pass which entries were selected
onSave(trimmed, Array.from(selectedEntryIds));
```

**New UI section** (after the items list, before footer):
```tsx
{otherEntries && otherEntries.length > 0 && (
  <div className="space-y-2 pt-2 border-t">
    <p className="text-sm font-medium">Add more from today:</p>
    {/* Show first 2 entries, with "Show N more" if needed */}
    {visibleEntries.map(entry => (
      <Checkbox entry with truncated preview />
    ))}
    {hiddenCount > 0 && <button>Show {hiddenCount} more...</button>}
  </div>
)}
```

#### 2. Update `SaveRoutineDialog.tsx`

Identical pattern to SaveMealDialog, with `WeightSet[]` instead of `FoodItem[]`.

#### 3. Update `FoodLog.tsx`

**Change state type:**
```typescript
// Before:
const [saveMealDialogData, setSaveMealDialogData] = useState<{
  entryId: string;
  rawInput: string | null;
  foodItems: FoodItem[];
} | null>(null);

// After: add created_at for chronological sorting
const [saveMealDialogData, setSaveMealDialogData] = useState<{
  entryId: string;
  rawInput: string | null;
  foodItems: FoodItem[];
  createdAt: string;  // For sorting other entries
} | null>(null);
```

**Compute otherEntries when dialog is open:**
```typescript
const otherEntriesForMealDialog = useMemo(() => {
  if (!saveMealDialogData) return [];
  
  return entries
    .filter(e => e.id !== saveMealDialogData.entryId)
    .sort((a, b) => {
      // Entries logged before current come first, newest-first
      const currentTime = new Date(saveMealDialogData.createdAt).getTime();
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      
      const aIsBefore = aTime < currentTime;
      const bIsBefore = bTime < currentTime;
      
      if (aIsBefore && !bIsBefore) return -1;
      if (!aIsBefore && bIsBefore) return 1;
      if (aIsBefore && bIsBefore) return bTime - aTime; // newest first
      return aTime - bTime; // oldest first
    })
    .map(e => ({
      entryId: e.id,
      items: e.food_items,
      rawInput: e.raw_input,
    }));
}, [saveMealDialogData, entries]);
```

**Update handleSaveAsMeal:**
```typescript
const handleSaveAsMeal = (entryId: string, rawInput: string | null, foodItems: FoodItem[]) => {
  const entry = entries.find(e => e.id === entryId);
  setSaveMealDialogData({ 
    entryId, 
    rawInput, 
    foodItems,
    createdAt: entry?.created_at || new Date().toISOString(),
  });
};
```

**Update handleSaveMealConfirm:**
```typescript
// Before: handleSaveMealConfirm = (name: string) => { ... }
// After: handleSaveMealConfirm = (name: string, additionalEntryIds: string[]) => { ... }

const handleSaveMealConfirm = (name: string, additionalEntryIds: string[] = []) => {
  if (!saveMealDialogData) return;
  
  // Combine items from primary entry + selected other entries
  let allItems = [...saveMealDialogData.foodItems];
  for (const entryId of additionalEntryIds) {
    const entry = entries.find(e => e.id === entryId);
    if (entry) {
      allItems = [...allItems, ...entry.food_items];
    }
  }
  
  saveMeal.mutate({
    name,
    originalInput: saveMealDialogData.rawInput, // Keep original entry's raw input
    foodItems: allItems,
  }, {
    onSuccess: () => setSaveMealDialogData(null),
  });
};
```

#### 4. Update `WeightLog.tsx`

Identical pattern to FoodLog.

---

### Edge Cases Handled

| Case | Behavior |
|------|----------|
| 0 other entries | "Add more from today" section not rendered |
| 1-2 other entries | All shown, no "Show more" button |
| 3+ other entries | First 2 shown, "Show N more" to reveal rest |
| Entry from saved meal/routine | Still offered for combining (useful: "breakfast + coffee") |
| Dialog closed without saving | State resets (dialog unmounts) |
| User unchecks all extras | Only primary entry items saved (current behavior) |

---

### What This Plan Does NOT Change

Keeping these unchanged reduces regression risk:

1. **Database schema** - No changes
2. **useSavedMeals / useSavedRoutines hooks** - No changes to mutation signatures
3. **Expanded panel UI in tables** - Only the dialog changes
4. **How items are stored** - Same `food_items` / `exercise_sets` format
5. **Name generation logic** - Still uses primary entry's first item

---

### Testing Checklist After Implementation

1. Open Save as Meal dialog with 0 other entries → no "Add more" section
2. Open Save as Meal dialog with 1 other entry → shows entry, no "Show more"
3. Open Save as Meal dialog with 5 other entries → shows 2, "Show 3 more" link
4. Check an entry, save → combined items appear in saved meal
5. Save without checking any extras → only primary entry saved
6. Close dialog, reopen → checkboxes are unchecked (state reset)
7. Same tests for Save as Routine

