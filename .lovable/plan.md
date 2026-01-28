

## Remove AI Routine Name Suggestion

Replace the AI-generated routine name with an immediate, formatted default name.

---

### Default Name Format

For the first exercise in the routine:
```
Lat Pulldown (3×10 @ 65 lbs)
```

---

### Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useSuggestRoutineName.ts` | **Delete** | Remove unused hook |
| `src/components/SaveRoutineDialog.tsx` | **Modify** | Remove AI props, compute default name from exercises |
| `src/pages/WeightLog.tsx` | **Modify** | Remove hook usage, simplify dialog state |
| `src/components/CreateRoutineDialog.tsx` | **Modify** | Remove hook, update fallback name format, pass no-op |

---

### Technical Details

**1. SaveRoutineDialog.tsx**

Remove props:
- `suggestedName`
- `isSuggestingName`

Add helper function:
```tsx
function getDefaultName(exerciseSets: WeightSet[]): string {
  if (exerciseSets.length === 0) return '';
  const first = exerciseSets[0];
  return `${first.description} (${first.sets}×${first.reps} @ ${first.weight_lbs} lbs)`;
}
```

Initialize name immediately when dialog opens using `useEffect`:
```tsx
useEffect(() => {
  if (open) {
    setName(getDefaultName(exerciseSets));
    setUserHasTyped(false);
  }
}, [open, exerciseSets]);
```

Remove all loading spinner UI and "Generating suggested name..." states.

**2. WeightLog.tsx**

- Remove import: `useSuggestRoutineName`
- Remove state: `suggestedRoutineName`
- Simplify `handleSaveAsRoutine` to just set dialog data (no AI call)
- Remove `suggestedName` and `isSuggestingName` props from SaveRoutineDialog

**3. CreateRoutineDialog.tsx**

- Remove import: `useSuggestRoutineName`
- Update `WEIGHTS_CONFIG.getFallbackName` to use new format:
```tsx
getFallbackName: (items) => {
  if (items.length === 0) return '';
  const first = items[0];
  return `${first.description} (${first.sets}×${first.reps} @ ${first.weight_lbs} lbs)`;
},
```
- Pass no-op to `suggestNameResult`:
```tsx
suggestNameResult={{ suggestName: async () => null, isLoading: false }}
```

**4. Delete useSuggestRoutineName.ts**

File is no longer used.

