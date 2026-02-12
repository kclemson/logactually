

## Add "Resolved" Status to Feedback

### Overview

Add a `resolved_at` timestamp column to the feedback table. Admins can mark feedback as resolved via a link in the admin UI. Resolved items move to a separate collapsed section. On the user side, resolved feedback shows a subtle "Resolved" badge so the user knows their issue was addressed.

### Database

Add a `resolved_at` column to the `feedback` table (nullable timestamp, default null). No new RLS policies needed -- existing admin UPDATE and user SELECT policies cover it.

### Admin UI (Admin.tsx)

- Split feedback into two lists: `open` (where `resolved_at` is null) and `resolved` (where it's set)
- Show open feedback in the existing "Feedback" collapsible section (count updates to open only)
- Add a "Resolve" link next to "Edit Reply" / "Reply" for each item
- When clicked, sets `resolved_at` to now -- no confirmation dialog needed (simple toggle)
- Show resolved items in a second collapsible section "Resolved (N)", collapsed by default
- Resolved items show an "Unresolve" link to undo

### User UI (FeedbackForm.tsx)

- For feedback that has both a `response` and a `resolved_at`, show a small green "Resolved" label next to the response date
- This gives the user a clear signal their issue was handled without being intrusive
- No behavior change otherwise -- they can still delete their own feedback

### Hook Changes

- **FeedbackTypes.ts**: Add `resolved_at: string | null` to both `FeedbackWithUser` and `UserFeedback`
- **FeedbackAdminList.ts**: Include `resolved_at` in the select query and map it through
- **FeedbackUserHistory.ts**: Include `resolved_at` in the select query
- **New hook `FeedbackResolve.ts`**: Simple mutation that updates `resolved_at` on a feedback row (set or clear). Invalidates `adminFeedback` query key.
- **Export from `index.ts`**

### Technical Details

Migration SQL:
```sql
ALTER TABLE feedback ADD COLUMN resolved_at timestamptz DEFAULT NULL;
```

Admin feedback splitting logic:
```typescript
const openFeedback = feedback?.filter(f => !f.resolved_at) ?? [];
const resolvedFeedback = feedback?.filter(f => !!f.resolved_at) ?? [];
```

Resolve hook mutation:
```typescript
mutationFn: async ({ feedbackId, resolve }: { feedbackId: string; resolve: boolean }) => {
  await supabase.from('feedback')
    .update({ resolved_at: resolve ? new Date().toISOString() : null })
    .eq('id', feedbackId);
}
```

