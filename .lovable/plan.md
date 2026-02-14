

## Add Custom Log Columns to Admin User Table

### Changes

**1. Database function (`get_user_stats`)** -- SQL migration

Add two new fields to the per-user query:
- `custom_logs_enabled`: boolean -- checks if the user's profile `settings->'showCustomLogs'` is true
- `custom_log_entries_count`: integer -- count of rows in `custom_log_entries` for that user

These are two additional scalar subqueries in the existing `get_user_stats` function, matching the pattern already used for `login_count`, `saved_meals_count`, etc.

**2. Hook (`src/hooks/useAdminStats.ts`)**

Add to the `UserStats` interface:
- `custom_logs_enabled: boolean`
- `custom_log_entries_count: number`

**3. Admin page (`src/pages/Admin.tsx`)**

- Import `useIsMobile` from `@/hooks/use-mobile`
- Call `const isMobile = useIsMobile()` inside the component (before conditional returns)
- Hide "Logins" and "L2day" columns (header + body cells) when `isMobile` is true
- Add two new columns after the existing SW column:
  - **C** -- shows a checkmark or dash based on `custom_logs_enabled`, colored green if enabled
  - **Cs** -- shows the count from `custom_log_entries_count`, using the existing muted-when-zero pattern

### Column Layout on Mobile vs Desktop

```text
Desktop: User | Last | F2day | W2day | F | SF | W | SW | C | Cs | Logins | L2day
Mobile:  User | Last | F2day | W2day | F | SF | W | SW | C | Cs
```

### SQL Migration Detail

Adds to the `get_user_stats` function's SELECT list:
```sql
(SELECT COALESCE((p.settings->>'showCustomLogs')::boolean, false)) as custom_logs_enabled,
(SELECT COUNT(*) FROM custom_log_entries cle WHERE cle.user_id = p.id) as custom_log_entries_count
```
