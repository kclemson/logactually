

## Exclude Apple Health Imports from Pattern Detection Query

### Problem
The "save as routine" suggestion shows "252 similar exercises" because the query in `useRecentWeightEntries` includes Apple Health imported entries. These bulk imports shouldn't count toward the repeated-entry detection that drives routine save suggestions.

### Change (1 file)

**`src/hooks/useRecentWeightEntries.ts`**

Add a filter to exclude rows where `raw_input` equals `"apple-health-import"`:

```typescript
const { data, error } = await supabase
  .from('weight_sets')
  .select('entry_id, logged_date, exercise_key, source_routine_id, created_at')
  .gte('created_at', cutoffDate)
  .neq('raw_input', 'apple-health-import')   // <-- add this line
  .order('created_at', { ascending: false });
```

Also add `raw_input` to the select so the filter works correctly (it already does since `neq` is a WHERE clause filter, not a column projection requirement -- so just the `.neq()` line is sufficient).

No other files need changes.

