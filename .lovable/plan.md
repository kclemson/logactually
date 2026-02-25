

# Add saved charts count and custom log types count to admin user table

## Scope
Two new columns in the admin user stats table: number of saved charts and number of custom log types per user.

## Changes

### 1. Database migration — update `get_user_stats` function
Add two subqueries to the existing function:
- `saved_charts_count`: `SELECT COUNT(*) FROM saved_charts sc WHERE sc.user_id = p.id`
- `custom_log_types_count`: `SELECT COUNT(*) FROM custom_log_types clt WHERE clt.user_id = p.id`

The function already follows this exact pattern for `saved_meals_count` and `saved_routines_count`, so it's a straightforward addition.

### 2. TypeScript type — `src/hooks/useAdminStats.ts`
Add to the `UserStats` interface:
- `saved_charts_count: number`
- `custom_log_types_count: number`

### 3. Admin page — `src/pages/Admin.tsx`
Add two columns to the user stats table for "Charts" and "Log Types" (or similar short headers), displaying the new counts.

## Files

| File | Change |
|---|---|
| DB migration | Add `saved_charts_count` and `custom_log_types_count` subqueries to `get_user_stats` |
| `src/hooks/useAdminStats.ts` | Add two fields to `UserStats` interface |
| `src/pages/Admin.tsx` | Add two table columns |

