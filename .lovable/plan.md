
## Fix: Restore Expand Chevron for Routine-Sourced Entries

### What Happened

During the Feb 4 "save suggestion" feature work, we cleaned up how routine logs are stored:

- **Before**: `raw_input` was set to `"From saved routine"` as a placeholder
- **After**: `raw_input` is `null`, with `source_routine_id` properly tracking the origin

The change in `WeightLog.tsx` line 316 has the revealing comment:
```tsx
setDemoPreviewRawInput(null); // Saved routines don't have raw input to show
```

The assumption was correct that routines don't have *raw input*, but wrong that there's nothing to show - the routine name is still valuable information.

### Why It Broke

`WeightItemsTable.tsx` only shows the expand chevron when `hasRawInput` is true:
```tsx
const hasRawInput = !!currentRawInput;
// ...
{isLastInEntry && hasRawInput ? (chevron) : null}
```

The `entrySourceRoutineIds` prop is passed but not used in this logic.

### The Fix

Update the expand condition to check for **either** raw input **or** routine source:

**File: `src/components/WeightItemsTable.tsx`**

```text
Line ~366: Add isExpandable calculation
Line ~389, ~431: Update render condition
```

```tsx
// Add after line 366
const isFromRoutine = currentEntryId ? entrySourceRoutineIds?.has(currentEntryId) : false;
const isExpandable = hasRawInput || isFromRoutine;

// Update conditions at lines 389 and 431
{isLastInEntry && isExpandable ? ( ... ) : null}
```

### Why This Is Safe

1. No database changes needed
2. The expanded panel already handles routine display correctly (shows "From saved routine: [name]")
3. Works for existing entries with `raw_input: null`
4. Uses the semantically correct `source_routine_id` field
