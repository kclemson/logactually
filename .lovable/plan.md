

## Track Login Count for All Users

### Overview

Add a `login_count` column to profiles for all users, incremented on every successful login. Display the demo user's count on the Admin page (with the option to see all users' counts later).

---

### Why Client-Side (Not Trigger)

The `auth.users` table is in Supabase's reserved schema - we cannot attach triggers to it. The cleanest alternative is incrementing in `useAuth.tsx`'s `signIn` function, which is the single entry point for all logins.

---

### Database Changes

#### 1. Add Column to Profiles

```sql
ALTER TABLE profiles ADD COLUMN login_count integer NOT NULL DEFAULT 0;
```

#### 2. Create Increment Function

```sql
CREATE OR REPLACE FUNCTION increment_login_count(user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE profiles 
  SET login_count = login_count + 1
  WHERE id = user_id;
$$;
```

This uses `SECURITY DEFINER` so it works even for read-only users (the demo account).

---

### Frontend Changes

#### `src/hooks/useAuth.tsx`

Update the `signIn` function to increment counter after successful login:

```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  // Track login count (fire-and-forget, don't block auth flow)
  if (!error && data.user) {
    supabase.rpc('increment_login_count', { user_id: data.user.id }).catch(() => {});
  }
  
  return { error };
};
```

#### `src/hooks/useAdminStats.ts`

The existing `get_user_stats` RPC already queries profiles - we just need to include the new column. Update the TypeScript interface:

```typescript
interface UserStats {
  // ... existing fields
  login_count: number;
}
```

#### `src/pages/Admin.tsx`

Add login count to the user stats table (new column after "Last Active"):

| User | ... | Last Active | Logins |
|------|-----|-------------|--------|
| KC   | ... | Jan 29      | 47     |

---

### Database Function Update

Update `get_user_stats` to include login_count:

```sql
-- In the SELECT inside get_user_stats:
p.login_count
```

---

### Summary

| Component | Change |
|-----------|--------|
| Database | Add `login_count` column to profiles |
| Database | Add `increment_login_count()` function |
| Database | Update `get_user_stats` to include login_count |
| `useAuth.tsx` | Call increment RPC after successful signIn |
| `useAdminStats.ts` | Add `login_count` to UserStats interface |
| `Admin.tsx` | Display login count in user table |

---

### Benefits

- **All users tracked** - not just demo
- **Single code path** - `signIn` handles both regular and demo logins  
- **Fire-and-forget** - doesn't block or slow down login
- **Works for read-only** - SECURITY DEFINER bypasses RLS
- **Extensible** - easy to add "logins last 7 days" later using timestamps if needed

