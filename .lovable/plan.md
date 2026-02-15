

# Extract Shared Feedback Message Display Component

## What

Create a `FeedbackMessageBody` component that renders the labeled "You wrote" block and "Response" block, then use it in all three locations: FeedbackForm (user Help page), Admin open feedback, and Admin resolved feedback.

## New file: `src/components/FeedbackMessageBody.tsx`

A small presentational component accepting:
- `message: string` -- the user's message text
- `createdAt: string` -- ISO timestamp for the "You wrote" label
- `response: string | null` -- admin response text (renders nothing if null)
- `respondedAt: string | null` -- ISO timestamp for the "Response" label

Renders:
```
border-l user block:
  "You wrote (MMM d, HH:mm):"
  [message text]

border-l response block (if response exists):
  "Response (MMM d HH:mm):"
  [response text]
```

Both blocks use `ml-3 pl-3 border-l-2` with `border-border` for the user block and `border-primary/30` for the response block. Text is `text-xs whitespace-pre-wrap`.

## Updated files

### `src/components/FeedbackForm.tsx` (lines 178-188)
Replace the inline `<p>` + response `<div>` with:
```tsx
<FeedbackMessageBody
  message={item.message}
  createdAt={item.created_at}
  response={item.response}
  respondedAt={item.responded_at}
/>
```

### `src/pages/Admin.tsx` -- Open feedback (lines 438-448)
Replace the inline message + response block with:
```tsx
<FeedbackMessageBody
  message={f.message}
  createdAt={f.created_at}
  response={replyingToId !== f.id ? f.response : null}
  respondedAt={f.responded_at}
/>
```
(The `replyingToId` guard stays -- when replying, the response is hidden so the reply textarea takes its place.)

### `src/pages/Admin.tsx` -- Resolved feedback (lines 532-542)
Same replacement:
```tsx
<FeedbackMessageBody
  message={f.message}
  createdAt={f.created_at}
  response={f.response}
  respondedAt={f.responded_at}
/>
```

## Technical notes

- Uses `format` and `parseISO` from `date-fns` (already a dependency)
- Timestamp format updated from `"MMM d"` to `"MMM d HH:mm"` on both labels
- No new dependencies, no schema changes
- Three rendering sites reduced to one source of truth
