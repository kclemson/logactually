## Bug
On `/custom`, opening the "Log New" dropdown and then clicking the backdrop (dismiss without selecting) pops open the value-input dialog showing the chart for the currently-viewed log type.

## Cause
In `src/pages/OtherLog.tsx` (lines ~267–283), the By-Date "Log New" `<Select>` uses `onOpenChange` to trigger the input dialog:

```ts
onOpenChange={(open) => {
  if (!open && effectiveTypeId && !createNewClickedRef.current) {
    setShowInputDialog(true);
  }
  createNewClickedRef.current = false;
}}
```

`effectiveTypeId` is already populated (it reflects the currently viewed log type, not a fresh selection). So any close of the dropdown — including a backdrop click with no selection — satisfies the condition and opens the input dialog.

## Fix
Trigger the dialog only when the user actually picks a type, not on dropdown dismiss.

- Remove the `onOpenChange` dialog-opening logic.
- In `onValueChange`, when a real log-type value is chosen (not `__create_new__`), call `setSelectedTypeId(val)` **and** `setShowInputDialog(true)` in the same handler.
- Keep the `createNewClickedRef` / `__create_new__` branch as-is for the template picker.

This is purely a frontend behavior fix, scoped to the one `<Select>` block. The medication dropdown above already uses this pattern correctly and is unaffected.

## Out of scope
- Any change to the chart, dialog content, or persistence logic.
- Touching the By-Meds dropdown.