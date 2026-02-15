

# Fix: Add missing SELECT policy for user feedback

## Problem

The `feedback` table has no SELECT policy for regular users. The only SELECT policy is admin-only:

- "Admins can view all feedback" (SELECT) -- admin only

So when a user submits feedback and the app queries their history, the query returns zero rows.

## Solution

Add one RLS policy via a database migration:

```sql
CREATE POLICY "Users can view own feedback"
  ON public.feedback
  FOR SELECT
  USING (auth.uid() = user_id);
```

This mirrors the pattern used on every other user-facing table in the project (food_entries, weight_sets, saved_meals, etc.).

## Files changed

None -- this is a database-only migration. No code changes needed since `useUserFeedback` already queries with `.eq('user_id', user.id)` and will start returning results once the policy is in place.

