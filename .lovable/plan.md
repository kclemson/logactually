
## Make demo unlock button red

Add a conditional red style to the toggle button when the demo account is unlocked (writable).

### Change

**`src/pages/Admin.tsx` (line 183)** -- add conditional class:
- When unlocked: red text and red border (`text-destructive border-destructive`)
- When locked: keep current neutral styling

This is a one-line className change using the existing `cn()` utility and the `demoLocked` state.
