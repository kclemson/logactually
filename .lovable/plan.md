

# Add Beta column to Admin user table

## Summary
Add a "B" column to the admin user stats table showing which users have the beta role, with a green checkmark or dash indicator.

## Changes

### 1. Database: Update `get_user_stats` function
Add an `is_beta` field to the query result by checking the `user_roles` table:
```sql
(SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p.id AND role = 'beta')) as is_beta
```
This goes inside the existing SELECT block alongside other per-user fields like `custom_logs_enabled`.

### 2. `src/pages/Admin.tsx` -- Add "B" column

- Add a new `<th>` header "B" between the existing "Cs" column and the end of the header row (after line 267)
- Add a new `<td>` cell after the custom_log_entries_count cell (after line 431) showing:
  - Green checkmark when `user.is_beta` is true
  - Dash when false
  - Same styling pattern as the "C" (custom logs enabled) column

### Result
The table will show: User, Last, F2d, W2d, F, SF, W, SW, C, Cs, **B** -- with a green checkmark for beta users and a dash for non-beta users.

