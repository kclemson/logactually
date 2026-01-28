

## Remove Delete Confirmation from Weight Items Table

### Overview
Remove the AlertDialog confirmation when deleting entries from the WeightItemsTable. Clicking the trash button will immediately delete the entry without prompting.

---

### Change

**File:** `src/components/WeightItemsTable.tsx`

**Current (lines 302-329):** Entry deletion uses AlertDialog with confirmation
```tsx
{hasEntryDeletion && isLastInEntry ? (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button ...>
        <Trash2 />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      ... "Delete this entry?" confirmation ...
    </AlertDialogContent>
  </AlertDialog>
) : ...}
```

**After:** Simple button with direct onClick handler
```tsx
{hasEntryDeletion && isLastInEntry ? (
  <Button
    variant="ghost"
    size="icon"
    onClick={() => onDeleteEntry?.(currentEntryId!)}
    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
  >
    <Trash2 className="h-3.5 w-3.5" />
  </Button>
) : ...}
```

---

### Additional Cleanup

Remove unused AlertDialog imports from WeightItemsTable since they'll no longer be needed for entry deletion:
- `AlertDialogAction`
- `AlertDialogCancel`
- `AlertDialogContent`
- `AlertDialogDescription`
- `AlertDialogFooter`
- `AlertDialogHeader`
- `AlertDialogTitle`
- `AlertDialogTrigger`

**Note:** Keep `AlertDialog` imports if still used for "Delete All" in the TotalsRow. Based on lines 162-208, the TotalsRow also uses AlertDialog for the "Delete all exercises?" confirmation - that should stay since it's a bulk destructive action.

---

### Summary

| Action | Before | After |
|--------|--------|-------|
| Delete single entry | Confirmation dialog | Immediate delete |
| Delete all exercises | Confirmation dialog | Confirmation dialog (unchanged) |

