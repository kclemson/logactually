

# Match admin reply format to end-user follow-up pattern (with 12-hour clock)

## What changes

### 1. `src/pages/Admin.tsx` — Add "New Reply" button + append logic

- Add `replyMode` state: `'edit' | 'new'` (default `'new'`).
- `handleStartReply` accepts a `mode` parameter:
  - `'edit'`: pre-fills textarea with existing response (current behavior)
  - `'new'`: empty textarea
- `handleSendReply` checks `replyMode`:
  - `'edit'`: replaces response as today
  - `'new'`: appends using the exact same format as end-user follow-ups:
    ```
    {existingResponse}
    ---
    Follow-up on Feb 18 2:45 PM:
    {newText}
    ```
- Button row when a response exists: show both **"Edit Reply"** and **"New Reply"** links. When no response exists, show just **"Reply"** (works as edit/replace, since there's nothing to append to).
- Show existing response in expanded view even when in `'new'` reply mode (only hide in `'edit'` mode, matching current behavior).

### 2. `src/pages/Admin.tsx` — 12-hour timestamp format

Use `format(new Date(), "MMM d h:mm a")` instead of 24-hour format for the append separator.

### 3. `src/components/FeedbackForm.tsx` — 12-hour clock fix (line 75)

Change the end-user follow-up format from `"MMM d HH:mm"` (24h) to `"MMM d h:mm a"` (12h) so both sides are consistent:

Before: `Follow-up on Feb 17 09:32:`
After: `Follow-up on Feb 17 9:32 AM:`

### No other files need changes

- `FeedbackAdminRespond.ts` already accepts a full response string — no changes.
- `FeedbackMessageBody.tsx` renders with `whitespace-pre-wrap` — the `---` separators display naturally.

