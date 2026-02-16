

# Sort resolved feedback by most recently updated

## What changes

The resolved feedback list in the admin portal currently inherits the `created_at desc` sort order from the database query. This means if you resolve an old feedback item, it stays buried at the bottom. Instead, resolved items should sort by their most recent activity -- whichever is latest among `resolved_at`, `responded_at`, or `created_at`.

## How it works

This is a client-side sort on the already-fetched data. No database changes needed.

On line 49 of `Admin.tsx`, where `resolvedFeedback` is computed:

```
const resolvedFeedback = feedback?.filter(f => !!f.resolved_at) ?? [];
```

Add a `.sort()` after the filter that compares the latest timestamp across `resolved_at`, `responded_at`, and `created_at` for each item, descending. This covers:
- Just resolved something --> `resolved_at` is newest, goes to top
- User added a follow-up reply --> the message is updated (and if re-resolved, `resolved_at` updates)
- Admin responded --> `responded_at` is newest, goes to top

## Technical details

### File: `src/pages/Admin.tsx`

Change the `resolvedFeedback` computation (line 49) to sort by the most recent of the three timestamps:

```typescript
const resolvedFeedback = (feedback?.filter(f => !!f.resolved_at) ?? [])
  .sort((a, b) => {
    const latest = (f: FeedbackWithUser) =>
      Math.max(
        new Date(f.resolved_at!).getTime(),
        f.responded_at ? new Date(f.responded_at).getTime() : 0,
        new Date(f.created_at).getTime(),
      );
    return latest(b) - latest(a);
  });
```

This requires importing `FeedbackWithUser` type (or just inlining the helper). No other files change.

### Files modified

| File | Change |
|---|---|
| `src/pages/Admin.tsx` | Sort `resolvedFeedback` by most recent timestamp descending |

