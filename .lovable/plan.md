

## Move Password Change to Dialog

Replace the inline password change form in the Account section with a "Change Password" button that opens a dedicated dialog.

---

### Changes Overview

1. **Create new component**: `src/components/ChangePasswordDialog.tsx`
2. **Update Settings page**: Replace inline form with button + dialog

---

### New File: `src/components/ChangePasswordDialog.tsx`

A self-contained dialog component that:
- Manages its own password state (currentPassword, newPassword, confirmPassword)
- Handles validation and submission
- Resets state when closed (via conditional rendering pattern)

```typescript
interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}
```

The dialog will contain:
- Current Password input
- New Password input  
- Confirm New Password input
- Error/success messages
- Cancel and Submit buttons

---

### Changes to `src/pages/Settings.tsx`

**1. Simplify Account section:**

Before:
```
┌─────────────────────────────────────┐
│ 👤 Account                      ▼   │
├─────────────────────────────────────┤
│ Email: user@example.com             │
│ Current Password: [............]    │
│ New Password: [............]        │
│ Confirm: [............]             │
│ [Change Password]                   │
└─────────────────────────────────────┘
```

After:
```
┌─────────────────────────────────────┐
│ 👤 Account                      ▼   │
├─────────────────────────────────────┤
│ Email: user@example.com             │
│ [Change Password]  ← button         │
└─────────────────────────────────────┘
```

**2. Remove password state from Settings** (moves to dialog component)

**3. Add dialog state and render:**
```typescript
const [changePasswordOpen, setChangePasswordOpen] = useState(false);

// In render:
{changePasswordOpen && (
  <ChangePasswordDialog
    open={changePasswordOpen}
    onOpenChange={setChangePasswordOpen}
    userEmail={user?.email || ''}
  />
)}
```

---

### Dialog UI Layout

```
┌────────────────────────────────────────┐
│ Change Password                     X  │
├────────────────────────────────────────┤
│ Enter your current password and choose │
│ a new password.                        │
│                                        │
│ Current Password                       │
│ [••••••••••••••]                       │
│                                        │
│ New Password                           │
│ [••••••••••••••]                       │
│                                        │
│ Confirm New Password                   │
│ [••••••••••••••]                       │
│                                        │
│ [error/success message if any]         │
│                                        │
│              [Cancel]  [Update]        │
└────────────────────────────────────────┘
```

---

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/ChangePasswordDialog.tsx` | New component with password form and logic |
| `src/pages/Settings.tsx` | Replace inline form with button + dialog |

