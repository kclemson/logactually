

## Move Delete Account Link to Email Row

Reposition the "Delete account" hyperlink to appear on the right side of the email row, creating a cleaner layout.

---

### Current Layout

```
┌─────────────────────────────────────┐
│ Email                               │
│ user@example.com                    │
│                                     │
│ [Change Password]  Delete account   │
└─────────────────────────────────────┘
```

### New Layout

```
┌─────────────────────────────────────┐
│ Email                Delete account │
│ user@example.com                    │
│                                     │
│ [Change Password]                   │
└─────────────────────────────────────┘
```

---

### Changes to `src/pages/Settings.tsx`

Update the Account section's structure to place the delete link in the email row:

**Before (lines ~99-113):**
```tsx
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs text-muted-foreground">Email</p>
      <p className="text-sm">{user?.email}</p>
    </div>
  </div>
  <Button ...>Change Password</Button>
  <button ...>Delete account</button>
</div>
```

**After:**
```tsx
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs text-muted-foreground">Email</p>
      <p className="text-sm">{user?.email}</p>
    </div>
    <button
      onClick={() => setDeleteAccountOpen(true)}
      className="text-sm text-muted-foreground hover:text-destructive hover:underline"
    >
      Delete account
    </button>
  </div>
  <Button ...>Change Password</Button>
</div>
```

---

### Visual Result

The "Delete account" link will be vertically centered on the right side of the email display row, keeping its subtle styling while making better use of horizontal space.

---

### File to Modify

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | Move delete account button inside the email row's flex container |

