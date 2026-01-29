
## Add Demo User Detection for Account Deletion

### Overview

Currently, the "Delete account" link is hidden for all read-only users (`!isReadOnly`). This works for the demo account but is too broad - future read-only accounts should still be able to delete themselves.

The solution is to add a `isDemoUser` check based on the user's email matching `DEMO_EMAIL`.

---

### Current State (Settings.tsx, line 105-112)

```tsx
{!isReadOnly && (
  <button onClick={() => setDeleteAccountOpen(true)} ...>
    Delete account
  </button>
)}
```

This hides delete for ALL read-only users.

---

### Proposed Change

**1. Import demo email constant**

```tsx
import { DEMO_EMAIL } from '@/lib/demo-mode';
```

**2. Create demo user check**

```tsx
const isDemoUser = user?.email === DEMO_EMAIL;
```

**3. Update delete account visibility**

```tsx
{!isDemoUser && (
  <button onClick={() => setDeleteAccountOpen(true)} ...>
    Delete account
  </button>
)}
```

Now:
- Demo user (`demo@logactually.com`): Cannot delete (shared public account)
- Other read-only users: CAN delete their own account
- Regular users: CAN delete their account

---

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | Import `DEMO_EMAIL`, add `isDemoUser` check, update delete button visibility |
