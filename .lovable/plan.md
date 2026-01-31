

## Fix: "User 0" Display Bug in Admin Feedback Section

### Problem
Feedback from user 17 displays as "User 0" because the `profiles` table RLS blocks admins from reading other users' profiles.

### Solution

**1. Database Migration**

Add RLS policy to allow admins to view all profiles:

```sql
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
```

**2. Update Display Format in Admin.tsx**

Change the feedback display to show "User #17" format:

```typescript
// Before
{USER_NAMES[f.user_number] ?? `User ${f.user_number}`}

// After  
{USER_NAMES[f.user_number] ?? `User #${f.user_number}`}
```

Also update the user stats table for consistency:

```typescript
// Before
{USER_NAMES[user.user_number] ?? `User ${user.user_number}`}

// After
{USER_NAMES[user.user_number] ?? `User #${user.user_number}`}
```

### Files Changed

| File | Change |
|------|--------|
| New migration | Add admin SELECT policy for profiles table |
| `src/pages/Admin.tsx` | Update fallback format to "User #X" |

### Security Summary

- `profiles` contains: `user_number`, `login_count`, `is_read_only`, `settings` (theme preference), timestamps
- No PII (emails/names are in protected `auth.users`)
- Admins already see most of this via existing stats functions
- Follows same pattern as `feedback` and `prompt_tests` admin policies

### Risk: Very Low

Simple addition following established patterns. No changes to existing user-facing behavior.

