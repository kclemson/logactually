
## Update Welcome Dialog for Demo Users

### Overview

Modify the ReadOnlyOverlay component to show different button configurations depending on the overlay mode:
- **Welcome mode** (first load): Show only "OK" button (no "Create Free Account")
- **Blocked mode** (after trying to save): Show both "OK" and "Create Free Account" buttons

---

### Current State

The dialog currently shows both buttons regardless of mode:
```tsx
<DialogFooter className="flex-col gap-2 sm:flex-row">
  <Button variant="outline" onClick={dismissOverlay} className="w-full sm:w-auto">
    Keep Browsing
  </Button>
  <Button onClick={handleCreateAccount} className="w-full sm:w-auto">
    Create Free Account
  </Button>
</DialogFooter>
```

---

### Proposed Changes

**1. Rename "Keep Browsing" to "OK"**

Change the button text from "Keep Browsing" to "OK".

**2. Conditionally show "Create Free Account" button**

Only show the "Create Free Account" button when `overlayMode === 'blocked'` (when user tries to save).

```tsx
<DialogFooter className="flex-col gap-2 sm:flex-row">
  <Button variant="outline" onClick={dismissOverlay} className="w-full sm:w-auto">
    OK
  </Button>
  {!isWelcome && (
    <Button onClick={handleCreateAccount} className="w-full sm:w-auto">
      Create Free Account
    </Button>
  )}
</DialogFooter>
```

---

### Result

| Mode | Buttons Shown |
|------|---------------|
| Welcome (first load) | "OK" only |
| Blocked (after save attempt) | "OK" + "Create Free Account" |

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/ReadOnlyOverlay.tsx` | Rename button to "OK", conditionally render "Create Free Account" |
