

## Fix: Show Resolved Indicator Even Without a Response

### Problem

The "Resolved" badge is nested inside `{item.response && (...)}` (line 137 of FeedbackForm.tsx), so it only appears when admin has written a response. The resolved item in prod has no response text, so the badge never renders.

### Solution

Move the resolved indicator outside the response conditional block. Show it as a standalone element when `resolved_at` is set, regardless of whether a response exists.

### File: `src/components/FeedbackForm.tsx`

After the closing `</div>` of the message row (line 136), add a standalone resolved indicator before the response block:

```tsx
{item.resolved_at && !item.response && (
  <div className="ml-3 pl-3 border-l-2 border-green-500/30">
    <span className="text-xs text-green-600 dark:text-green-400">✓ Resolved</span>
  </div>
)}
```

The existing resolved badge inside the response block (lines 142-144) stays as-is for items that have both a response and a resolved status.

