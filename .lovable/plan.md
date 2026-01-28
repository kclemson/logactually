

## Add Expandable Row Input Display to Weight Log

### Overview
Add the same expandable chevron pattern from the Food Log to the Weight Log, allowing users to see their original input text when they click the chevron. This matches the existing UX pattern and prepares the UI for future saved routines functionality.

---

### Changes Required

#### 1. Update `useWeightEntries` Hook

**File:** `src/hooks/useWeightEntries.ts`

The hook currently fetches `raw_input` from the database but doesn't expose it. Need to include it in the returned data so the page can build the `entryRawInputs` map.

**Current (line 29-38):** Returns WeightSet without raw_input
```typescript
return (data as WeightSetRow[]).map(row => ({
  id: row.id,
  uid: row.id,
  entryId: row.entry_id,
  // ... other fields
  // raw_input NOT included
}));
```

**Change:** Return raw data alongside the transformed weight sets, or add a separate property for raw inputs by entry. The simplest approach: add `rawInputs` Map to the returned object.

---

#### 2. Update `WeightLog.tsx` Page

**File:** `src/pages/WeightLog.tsx`

Add state and props to support expandable entries:

1. Add `expandedEntryIds` state (same as FoodLog)
2. Build `entryRawInputs` Map from weight sets data
3. Add `handleToggleEntryExpand` function
4. Pass new props to `WeightItemsTable`

**New imports needed:** None additional

**New state:**
```typescript
const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());
```

**Build raw inputs map:**
```typescript
const entryRawInputs = useMemo(() => {
  const map = new Map<string, string>();
  // Since raw_input is stored on first set of each entry, iterate and pick first non-null
  weightSets.forEach(set => {
    if (set.rawInput && !map.has(set.entryId)) {
      map.set(set.entryId, set.rawInput);
    }
  });
  return map;
}, [weightSets]);
```

**Toggle handler:**
```typescript
const handleToggleEntryExpand = (entryId: string) => {
  setExpandedEntryIds(prev => {
    const next = new Set(prev);
    if (next.has(entryId)) next.delete(entryId);
    else next.add(entryId);
    return next;
  });
};
```

**Pass to table:**
```tsx
<WeightItemsTable
  // ... existing props
  entryRawInputs={entryRawInputs}
  expandedEntryIds={expandedEntryIds}
  onToggleEntryExpand={handleToggleEntryExpand}
/>
```

---

#### 3. Update `WeightSet` Type

**File:** `src/types/weight.ts`

Add optional `rawInput` field to WeightSet interface for data flow (only populated for first set of each entry):

```typescript
export interface WeightSet {
  // ... existing fields
  rawInput?: string | null;  // Only present on first set of entry
}
```

---

#### 4. Update `WeightItemsTable` Component

**File:** `src/components/WeightItemsTable.tsx`

Add chevron button and expanded section, matching FoodItemsTable pattern:

**New props:**
```typescript
interface WeightItemsTableProps {
  // ... existing props
  entryRawInputs?: Map<string, string>;
  expandedEntryIds?: Set<string>;
  onToggleEntryExpand?: (entryId: string) => void;
}
```

**In description cell:** Replace static `<div className="w-3 shrink-0" />` with chevron button:
```tsx
{showEntryDividers && (
  <div className="w-3 shrink-0 relative flex items-center justify-center self-stretch">
    {isLastInEntry ? (
      <button
        onClick={() => currentEntryId && onToggleEntryExpand?.(currentEntryId)}
        className={cn(
          "absolute inset-0 w-[44px] -left-3 flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground transition-transform text-xl",
          isCurrentExpanded && "rotate-90"
        )}
      >
        ›
      </button>
    ) : null}
  </div>
)}
```

**After row div:** Add expanded content section:
```tsx
{showEntryDividers && isLastInEntry && isCurrentExpanded && (
  <div className={cn('grid gap-0.5', gridCols)}>
    <div className="col-span-full pl-6 py-1">
      {currentRawInput && (
        <p className="text-muted-foreground whitespace-pre-wrap italic">
          {currentRawInput}
        </p>
      )}
      {/* Future: "Save as routine" link will go here */}
    </div>
  </div>
)}
```

**Derive new local variables in row render:**
```typescript
const isCurrentExpanded = currentEntryId ? expandedEntryIds?.has(currentEntryId) : false;
const currentRawInput = currentEntryId ? entryRawInputs?.get(currentEntryId) : null;
```

---

### Files to Modify

1. `src/types/weight.ts` - Add optional `rawInput` field to WeightSet
2. `src/hooks/useWeightEntries.ts` - Include `raw_input` in returned data
3. `src/pages/WeightLog.tsx` - Add expand state, build rawInputs map, pass props
4. `src/components/WeightItemsTable.tsx` - Add chevron, expand props, expanded section

---

### Technical Notes

- The chevron uses the Unicode character `›` (same as FoodItemsTable) for perfect baseline alignment
- The chevron appears on the last item of each entry (where the entry boundary ends)
- The expanded section shows below the last item of the entry
- Raw input is stored on the first set of each entry (index === 0) per existing createEntry logic

