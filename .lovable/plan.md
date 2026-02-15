

# Feedback System Enhancements

## 1. Header rename
Change "Help" to "Help & Feedback" in `src/components/Header.tsx`.

## 2. Database migration
Add two columns to the `feedback` table:
- `feedback_id` (integer, auto-increment from 1000) -- the user-visible ID
- `resolved_reason` (text, nullable) -- e.g. "fixed", with more values possible later

Backfill existing 19 rows with sequential feedback_id starting at 1000. Create a sequence starting at 1019 for future rows.

```sql
ALTER TABLE feedback ADD COLUMN feedback_id integer;
ALTER TABLE feedback ADD COLUMN resolved_reason text;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) + 999 AS num
  FROM feedback
)
UPDATE feedback SET feedback_id = numbered.num FROM numbered WHERE feedback.id = numbered.id;

CREATE SEQUENCE feedback_id_seq START WITH 1019;
ALTER TABLE feedback ALTER COLUMN feedback_id SET DEFAULT nextval('feedback_id_seq');
ALTER TABLE feedback ALTER COLUMN feedback_id SET NOT NULL;
```

## 3. Type updates

**`src/hooks/feedback/FeedbackTypes.ts`** -- add `feedback_id: number` and `resolved_reason: string | null` to both interfaces.

## 4. Query updates

**`src/hooks/feedback/FeedbackAdminList.ts`** -- add `feedback_id, resolved_reason` to select and mapping.

**`src/hooks/feedback/FeedbackUserHistory.ts`** -- add `feedback_id, resolved_reason` to select.

## 5. Resolve mutation update

**`src/hooks/feedback/FeedbackResolve.ts`** -- extend to accept optional `reason: string` param. When resolving, set `resolved_reason` to the provided value (or null). When unresolving, clear both `resolved_at` and `resolved_reason`.

## 6. Admin feedback UI (`src/pages/Admin.tsx`)

- Show `#NNNN` (feedback_id) next to user number in each feedback item
- Add green "Resolve Fixed" link next to existing "Resolve" link, which calls resolve with `reason: 'fixed'`
- In resolved section, show green "Fixed" badge for items with `resolved_reason === 'fixed'`

## 7. User feedback UI (`src/components/FeedbackForm.tsx`)

Redesign each feedback item as a collapsible row:

- **Collapsed row**: `#1001  Feb 15, 2026  [Resolved / Resolved (Fixed)]  [Re-open]` on the first line, then a truncated preview of the message (first ~80 chars + "...") on the second line. Clicking the row expands it.
- **Expanded view**: Full message text, admin response (if any), Reply button, delete button.
- **Reply on open items**: Add a "Reply" link (same as current re-open but without changing resolved_at) that opens a textarea to append a follow-up message.
- Resolved items with `resolved_reason === 'fixed'` show status in green ("Resolved (Fixed)").
- Show `#feedback_id` next to the date.

## Technical details

| File | Change |
|------|--------|
| Database | Add `feedback_id` (int, seq from 1000) and `resolved_reason` (text) columns |
| `src/components/Header.tsx` | "Help" -> "Help & Feedback" |
| `src/hooks/feedback/FeedbackTypes.ts` | Add `feedback_id` and `resolved_reason` to interfaces |
| `src/hooks/feedback/FeedbackAdminList.ts` | Select and map new fields |
| `src/hooks/feedback/FeedbackUserHistory.ts` | Select new fields |
| `src/hooks/feedback/FeedbackResolve.ts` | Accept optional `reason` param, set/clear `resolved_reason` |
| `src/pages/Admin.tsx` | Show `#ID`, add "Resolve Fixed" green link, show "Fixed" badge |
| `src/components/FeedbackForm.tsx` | Collapsible rows with truncated preview, reply on open items, differentiated resolved status |

