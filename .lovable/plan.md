

## Reorganize Feedback Hooks into Dedicated Directory

### Summary

Create a `src/hooks/feedback/` directory with individual files for each hook, all prefixed with `Feedback*` for easy navigation.

### New File Structure

```
src/hooks/feedback/
├── index.ts                          # Re-exports all hooks
├── FeedbackTypes.ts                  # Shared interfaces
├── FeedbackSubmit.ts                 # useSubmitFeedback
├── FeedbackAdminList.ts              # useAdminFeedback
├── FeedbackAdminRespond.ts           # useRespondToFeedback (NEW)
├── FeedbackUserHistory.ts            # useUserFeedback (NEW)
├── FeedbackDelete.ts                 # useDeleteFeedback (NEW)
├── FeedbackUnreadStatus.ts           # useHasUnreadResponses (NEW)
└── FeedbackMarkRead.ts               # useMarkFeedbackRead (NEW)
```

### File Contents

**`FeedbackTypes.ts`** - Shared interfaces:
```typescript
export interface FeedbackWithUser {
  id: string;
  message: string;
  created_at: string;
  user_number: number;
  response: string | null;
  responded_at: string | null;
}

export interface UserFeedback {
  id: string;
  message: string;
  created_at: string;
  response: string | null;
  responded_at: string | null;
  read_at: string | null;
}
```

**`index.ts`** - Barrel export:
```typescript
export { useSubmitFeedback } from './FeedbackSubmit';
export { useAdminFeedback } from './FeedbackAdminList';
export { useRespondToFeedback } from './FeedbackAdminRespond';
export { useUserFeedback } from './FeedbackUserHistory';
export { useDeleteFeedback } from './FeedbackDelete';
export { useHasUnreadResponses } from './FeedbackUnreadStatus';
export { useMarkFeedbackRead } from './FeedbackMarkRead';
export type { FeedbackWithUser, UserFeedback } from './FeedbackTypes';
```

### Import Path Updates

Consumers can continue using the same import pattern:

```typescript
// Before
import { useSubmitFeedback } from '@/hooks/useFeedback';

// After (same style, different path)
import { useSubmitFeedback } from '@/hooks/feedback';
```

Files to update:
- `src/pages/Admin.tsx` - update import path
- `src/components/FeedbackForm.tsx` - update import path
- `src/components/Header.tsx` - add new import (for notification dot)

### Database Migration

Same as before - add columns to `feedback` table:

```sql
ALTER TABLE feedback ADD COLUMN response text DEFAULT NULL;
ALTER TABLE feedback ADD COLUMN responded_at timestamptz DEFAULT NULL;
ALTER TABLE feedback ADD COLUMN read_at timestamptz DEFAULT NULL;

-- RLS policies for update/delete
CREATE POLICY "Admins can update feedback" ON feedback
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own feedback" ON feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback" ON feedback
  FOR DELETE USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));
```

### File Changes Summary

| Action | File |
|--------|------|
| Delete | `src/hooks/useFeedback.ts` |
| Create | `src/hooks/feedback/index.ts` |
| Create | `src/hooks/feedback/FeedbackTypes.ts` |
| Create | `src/hooks/feedback/FeedbackSubmit.ts` |
| Create | `src/hooks/feedback/FeedbackAdminList.ts` |
| Create | `src/hooks/feedback/FeedbackAdminRespond.ts` |
| Create | `src/hooks/feedback/FeedbackUserHistory.ts` |
| Create | `src/hooks/feedback/FeedbackDelete.ts` |
| Create | `src/hooks/feedback/FeedbackUnreadStatus.ts` |
| Create | `src/hooks/feedback/FeedbackMarkRead.ts` |
| Update | `src/pages/Admin.tsx` - import path + reply UI |
| Update | `src/components/FeedbackForm.tsx` - import path + history UI |
| Update | `src/components/Header.tsx` - notification dot |

