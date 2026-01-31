

## Show Cardio Metadata in Expanded Section

### What You'll See

When you expand a cardio entry, you'll see the recorded details underneath it:
- Duration (e.g., "10 min")
- Distance (e.g., "2 miles")
- Only shown if the data exists for that exercise

For entries with multiple exercises (e.g., "treadmill 10min 2mi, bench 3x10 135"), only the cardio items will show their metadata.

---

### Implementation

**File: `src/components/WeightItemsTable.tsx`**

In the expanded content section (lines 598-643), add a cardio metadata block before the raw input:

```tsx
{/* Expanded content section */}
{showEntryDividers && isLastInEntry && isCurrentExpanded && (() => {
  const isFromSavedRoutine = currentEntryId && entrySourceRoutineIds?.has(currentEntryId);
  const routineName = currentEntryId && entryRoutineNames?.get(currentEntryId);
  
  // Get all exercises in this entry for cardio metadata
  const entryExercises = items.filter(i => i.entryId === currentEntryId);
  
  // Build cardio metadata for exercises that have duration/distance
  const cardioItems = entryExercises.filter(ex => 
    (ex.duration_minutes ?? 0) > 0 || (ex.distance_miles ?? 0) > 0
  );
  
  return (
    <div className={cn('grid gap-0.5', gridCols)}>
      <div className="col-span-full pl-6 py-1 space-y-1">
        
        {/* Cardio metadata - show for each cardio item */}
        {cardioItems.map((ex, idx) => {
          const parts: string[] = [];
          if ((ex.duration_minutes ?? 0) > 0) {
            parts.push(`${ex.duration_minutes} min`);
          }
          if ((ex.distance_miles ?? 0) > 0) {
            parts.push(`${ex.distance_miles} mi`);
          }
          
          return (
            <p key={ex.uid || idx} className="text-sm text-muted-foreground">
              <span className="font-medium">{ex.description}:</span>{' '}
              {parts.join(', ')}
            </p>
          );
        })}

        {/* Raw input (existing) */}
        {!isFromSavedRoutine && currentRawInput && (
          <p className="text-muted-foreground whitespace-pre-wrap italic">
            {currentRawInput}
          </p>
        )}
        
        {/* Routine info or Save as routine (existing) */}
        {/* ... */}
      </div>
    </div>
  );
})()}
```

---

### Display Examples

| Entry | Expanded Shows |
|-------|----------------|
| "Treadmill Run" (10min, 2mi) | **Treadmill Run:** 10 min, 2 mi |
| "Walk" (30min, no distance) | **Walk:** 30 min |
| "5K Run" (no duration, 3.1mi) | **5K Run:** 3.1 mi |
| "Bench Press" (weight exercise) | *(nothing - not cardio)* |
| Mixed entry: run + bench | Only the run shows metadata |

---

### Files Modified

| File | Change |
|------|--------|
| `src/components/WeightItemsTable.tsx` | Add cardio metadata display in expanded section |

