

# Fix Admin Feedback UX: Scroll Jump and Action Link Styles

## Changes

**File: `src/pages/Admin.tsx`**

### 1. Prevent jarring scroll when resolving

When "Resolve" or "Resolve Fixed" is clicked, the item disappears from the open list and appears in the resolved list, causing a layout shift that can jump the viewport. Fix by saving the scroll position before the mutation and restoring it after the query invalidation settles.

Create a wrapper function that captures `window.scrollY`, calls the mutation, and uses `onSettled` (or a rAF after mutate) to restore scroll position. Alternatively, use a simpler approach: wrap the resolve calls to save and restore scroll position via `mutateAsync` + `requestAnimationFrame`.

```typescript
const handleResolve = async (feedbackId: string, resolve: boolean, reason?: string) => {
  const scrollY = window.scrollY;
  await resolveFeedback.mutateAsync({ feedbackId, resolve, reason });
  requestAnimationFrame(() => window.scrollTo(0, scrollY));
};
```

Update all resolve/unresolve button `onClick` handlers to call `handleResolve` instead of `resolveFeedback.mutate` directly.

### 2. Always show underline on action links

Change all feedback action buttons (Reply, Edit Reply, Resolve, Resolve Fixed, Unresolve) from `hover:underline` to `underline` so they always appear as hyperlinks.

| Line(s) | Current | New |
|----------|---------|-----|
| 398 | `hover:underline` | `underline` |
| 404 | `hover:underline` | `underline` |
| 410 | `hover:underline` | `underline` |
| 503 | `hover:underline` | `underline` |

