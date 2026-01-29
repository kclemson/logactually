

## Create Demo User Account

### Overview

Create the demo user account (`demo@logactually.com`) with the password `demodemo` and mark it as read-only. This will enable the "try the demo" functionality on the auth page.

---

### Implementation Steps

**Step 1: Create the user via Supabase Admin API**

Use the Supabase admin function to create a user with:
- Email: `demo@logactually.com`
- Password: `demodemo`
- Email confirmed: `true` (so they can log in immediately)

**Step 2: Set profile to read-only**

After the user is created (the `handle_new_user` trigger automatically creates their profile), run a migration to update the profile:

```sql
UPDATE profiles 
SET is_read_only = true 
WHERE id = (SELECT id FROM auth.users WHERE email = 'demo@logactually.com');
```

---

### Technical Notes

- The `handle_new_user` database trigger automatically creates a profile row when a new user is created
- Setting `is_read_only = true` ensures all RLS policies block write operations for this user
- The demo credentials in `src/lib/demo-mode.ts` already match: `demo@logactually.com` / `demodemo`

---

### Verification

After implementation, clicking "try the demo" on the auth page should:
1. Successfully log in as the demo user
2. Redirect to the main app
3. Show the read-only banner (if implemented)

---

### Files Changed

| Location | Change |
|----------|--------|
| Database (auth.users) | Create user via admin API |
| Database (profiles) | Migration to set `is_read_only = true` |

