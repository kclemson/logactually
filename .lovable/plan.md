

## Add "Regenerate Saved Items Only" Button

### Overview
Add a quick action button to the PopulateDemoDataDialog that regenerates only saved meals and saved routines, without touching food entries or weight entries. This is useful for testing/iterating on the saved items data without waiting for the full AI parsing of 120+ food inputs.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/PopulateDemoDataDialog.tsx` | Add "Regenerate Saved Only" button that calls populate with food/weights disabled |

---

### Implementation Details

The edge function already supports this use case - it accepts `generateFood: false` and `generateWeights: false` while still processing saved meals and routines. We just need a UI shortcut.

**Add a secondary button in the dialog footer:**

```tsx
<DialogFooter className="flex gap-2">
  <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
    {result?.success ? "Close" : "Cancel"}
  </Button>
  
  {!result?.success && !result?.status && (
    <>
      {/* New quick action button */}
      <Button 
        variant="outline" 
        onClick={handleRegenerateSavedOnly} 
        disabled={isLoading}
      >
        {isLoading ? "Starting..." : "Saved Only"}
      </Button>
      
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? (
          <>
            <span className="spinner" />
            Starting...
          </>
        ) : (
          "Populate All"
        )}
      </Button>
    </>
  )}
</DialogFooter>
```

**Add the handler:**

```typescript
const handleRegenerateSavedOnly = async () => {
  const params: PopulateDemoDataParams = {
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
    clearExisting: true,  // Always clear saved items first
    generateFood: false,
    generateWeights: false,
    generateSavedMeals: savedMealsCount,
    generateSavedRoutines: savedRoutinesCount,
  };
  await populate(params);
};
```

---

### Why This Works Fast

When `generateFood: false` and `generateWeights: false`:
1. No food AI parsing batches (skips 12 batches, ~60-90 sec)
2. No weight entry generation
3. Only parses saved meal templates (1 batch, ~8 sec)
4. Only generates saved routines (no AI needed, instant)

**Estimated time: ~10 seconds** vs 1-2 minutes for full population.

---

### UI Layout

The dialog footer will have three buttons when no result is shown:

```text
[Cancel]          [Saved Only]          [Populate All]
   ghost             outline              primary
```

After clicking either action button, the result display appears and only "Close" remains.

---

### Edge Cases

- The "Saved Only" button will always clear existing saved meals/routines first (sets `clearExisting: true`)
- Date range is still passed but only used for `last_used_at` timestamps on saved items
- If saved meals count is 0, only routines are regenerated (and vice versa)

