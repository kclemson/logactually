

# Add Beta Role Column to Admin User Table

## What
Add a column to the admin user stats table that shows which users have the beta role, making it easy to see at a glance.

## Changes

### 1. Database: Update `get_user_stats` function
Add an `is_beta` field to the query result by checking the `user_roles` table:

```sql
(SELECT EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'beta'
)) as is_beta
```

### 2. Frontend: Update `useAdminStats.ts`
Add `is_beta: boolean` to the `UserStats` interface.

### 3. Frontend: Update `Admin.tsx`
- Add a "B" (Beta) column header after the "Cs" column (or next to User name)
- Show a green checkmark or indicator for users with the beta role
- Compact styling consistent with existing columns

The beta indicator will appear as a small "B" column showing a checkmark for beta users, keeping the table compact.

