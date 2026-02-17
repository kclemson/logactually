

# Move "Edit" button from header to footer

## Problem

The "Edit" button sits in the top-right corner directly next to the dialog's X close button. On mobile this is a fat-finger hazard -- users intending to edit will accidentally close the dialog. Beyond the proximity issue, the header isn't the best place for this action: users naturally read the content first, then decide to edit, so the action belongs at the bottom of the flow.

## Solution

Move the Edit button to a sticky footer bar at the bottom of the dialog. This means:

- **View mode**: footer shows a single "Edit" button (left-aligned or full-width)
- **Edit mode**: footer shows "Cancel" and "Save" buttons (same spot, same footer)
- **Header**: only contains the title and the X close button (standard Radix dialog pattern)

This puts the primary action in the thumb zone on mobile, eliminates the proximity issue with X, and creates a consistent footer area that's always the "action zone" regardless of mode.

## Technical details

### File: `src/components/DetailDialog.tsx`

**Header (lines 119-127)** -- remove the Edit button entirely:

```tsx
<DialogHeader className="px-4 pt-4 pb-2 flex-shrink-0">
  <DialogTitle className="text-base">{title}</DialogTitle>
</DialogHeader>
```

**Footer (currently only renders in edit mode, around line 155)** -- render in both modes:

```tsx
{!readOnly && (
  <DialogFooter className="px-4 py-3 border-t flex-shrink-0">
    {editing ? (
      <>
        <Button variant="outline" size="sm" onClick={cancelEdit}>Cancel</Button>
        <Button size="sm" onClick={handleSave}>Save</Button>
      </>
    ) : (
      <Button variant="outline" size="sm" onClick={enterEditMode} className="gap-1">
        <Pencil className="h-3 w-3" /> Edit
      </Button>
    )}
  </DialogFooter>
)}
```

No logic changes -- just moving the Edit entry point from header to footer so it's always in the same action zone as Save/Cancel.

