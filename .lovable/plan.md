# Replace native delete confirm in the memory viewer

## Problem
Deleting a memory in the immersive viewer (`MemoryViewer.tsx`) triggers the browser's default `confirm()` dialog instead of the styled confirmation used everywhere else in the app. This is the only place in the memory feature still using `window.confirm`.

## Fix
Swap the `confirm()` call for the existing Radix `AlertDialog` component (`@/components/ui/alert-dialog`), matching the pattern already used for group/entry deletion elsewhere in the project.

### Changes in `src/pages/MemoryViewer.tsx`
1. Import `AlertDialog` and its parts (`AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction`).
2. Add a small piece of state, `confirmDeleteOpen`, to control the dialog.
3. Change the delete action's `onClick` (the `'delete'` entry in `viewerActions`) to open the dialog instead of calling `confirm()` directly.
4. Move the existing deletion logic (the `deleteMemory.mutate(...)` block with its index-adjustment `onSuccess`) into the dialog's confirm handler; close the dialog on confirm.
5. Render the `AlertDialog` (conditionally, so it unmounts when closed per the project's useEffect/state guidelines) within the viewer overlay. The dialog portals to `body`, so it layers correctly above the `z-50` full-screen viewer.

### Copy
- Title: "Delete this memory?"
- Description: "This permanently removes the memory and all its photos and videos." (keeps the original warning intent)
- Cancel: "Cancel" / Confirm: "Delete" (danger styling)

## Out of scope
No backend, deletion-logic, or other behavior changes — only the confirmation UI is swapped.

## Verification
Load the viewer route, tap delete, confirm the styled AlertDialog appears above the viewer, that Cancel aborts and Delete removes the memory and advances the slide index correctly, with no console errors.