

# Admin Feedback: Collapsible Rows (with shared utility)

## 1. Extract shared `truncate` helper

Create `src/lib/feedback-utils.ts` with the `truncate` function currently in `FeedbackForm.tsx`:

```typescript
export const truncate = (text: string, maxLen = 80) => {
  const firstLine = text.split('\n')[0];
  if (firstLine.length <= maxLen) return firstLine;
  return firstLine.slice(0, maxLen) + '...';
};
```

Update `src/components/FeedbackForm.tsx` to import it from there instead of defining it inline.

## 2. Redesign admin feedback items in `src/pages/Admin.tsx`

Add collapsible row pattern matching the user-facing FeedbackForm:

- Add `expandedFeedbackIds` state as `Set<string>`
- Import `ChevronDown` and `truncate`

**Collapsed state** (two lines):
- Line 1: `#feedback_id`, date, `User #N`, status badge (green "Fixed" if applicable), action links (Reply, Resolve, Resolve Fixed / Unresolve)
- Line 2: Truncated message preview + chevron

**Expanded state:**
- Full message text, admin response (if any), reply form
- Compact `text-xs` styling throughout

Apply to both open and resolved feedback sections.

## Technical details

| File | Change |
|------|--------|
| `src/lib/feedback-utils.ts` | New file with `truncate` function |
| `src/components/FeedbackForm.tsx` | Remove inline `truncate`, import from `feedback-utils` |
| `src/pages/Admin.tsx` | Add `ChevronDown` import, `expandedFeedbackIds` state, collapsible row UI for both open and resolved sections, import `truncate` from `feedback-utils` |

