

## Fix Dialog Closing When Selecting Calendar Date

This is a known Radix UI issue: when a Popover is nested inside a Dialog, selecting a date in the Calendar causes the Popover to close, and the closing Popover triggers the Dialog's "outside click" handler, which closes the Dialog too.

### Fix

**File: `src/components/AppleHealthImport.tsx`**

Add `onInteractOutside` to the `DialogContent` to prevent the Dialog from closing when the user interacts with the calendar popover portal. The popover renders in a portal outside the DialogContent DOM, so the Dialog thinks it's an outside click.

Change:
```tsx
<DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
```

To:
```tsx
<DialogContent
  className="max-w-md max-h-[80vh] overflow-y-auto"
  onInteractOutside={(e) => e.preventDefault()}
>
```

This prevents the Dialog from closing on any outside interaction (including the calendar popover portal clicks). The user can still close the dialog via the X button or Escape key.

