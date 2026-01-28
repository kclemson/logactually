

## Add Account Section to Settings

Add a new "Account" section at the top of the Settings page that displays the logged-in user's email and provides an in-app password change form with the existing 6-character minimum requirement.

---

### Changes to `src/pages/Settings.tsx`

**1. Add new imports:**
```typescript
import { User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
```

**2. Add state and handlers for password change:**
- `currentPassword`, `newPassword`, `confirmPassword` state
- `passwordError`, `passwordSuccess` for feedback messages
- `isChangingPassword` loading state
- `handlePasswordChange` function that:
  - Validates passwords match
  - Validates minimum 6 characters
  - Re-authenticates with current password for security
  - Updates to new password via `supabase.auth.updateUser()`

**3. Add Account section UI (placed at top, before Saved Meals):**
- Email display (read-only)
- Password change form with three fields:
  - Current Password
  - New Password
  - Confirm New Password
- Error/success feedback
- Submit button with loading state

---

### Visual Layout

```
┌─────────────────────────────────────┐
│ 👤 Account                      ▼   │
├─────────────────────────────────────┤
│ Email                               │
│ user@example.com                    │
│                                     │
│ Current Password                    │
│ [••••••••••••••]                    │
│                                     │
│ New Password                        │
│ [••••••••••••••]                    │
│                                     │
│ Confirm New Password                │
│ [••••••••••••••]                    │
│                                     │
│ [Change Password]                   │
└─────────────────────────────────────┘
```

---

### Security Flow

1. User enters current password, new password, and confirmation
2. Client validates: passwords match + minimum 6 characters
3. Re-authenticate with current password (prevents unauthorized changes)
4. If successful, update password via Supabase Auth
5. Clear form and show success message

---

### File to Modify

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | Add Account section with email display and password change form |

