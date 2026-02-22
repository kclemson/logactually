

# Persist admin reply draft to localStorage on unmount

## Problem
When writing a reply to a user's feedback in the admin panel, switching tabs (e.g. to check something) and coming back causes the textarea content to be lost because `replyText` is plain React state that resets when the component unmounts.

## Approach
Save the draft to localStorage on component unmount, and restore it on mount. This avoids writing on every keystroke while still preserving work-in-progress text.

Specifically:
- On **unmount**: if there's an active reply (`replyingToId` is set and `replyText` is non-empty), save `{ id, text, mode }` to `localStorage` under a key like `admin-reply-draft`.
- On **mount**: check localStorage for a saved draft. If found, restore `replyingToId`, `replyText`, and `replyMode`, then expand that feedback item. Clear the stored draft.
- On **successful send** or **cancel**: clear the localStorage draft (already handled by the state resets, but we explicitly remove the key too).

## Technical details

**File: `src/pages/Admin.tsx`**

1. Add a cleanup effect that saves draft on unmount:

```typescript
// Use refs so the unmount effect always sees current values
const replyingToIdRef = useRef(replyingToId);
const replyTextRef = useRef(replyText);
const replyModeRef = useRef(replyMode);
replyingToIdRef.current = replyingToId;
replyTextRef.current = replyText;
replyModeRef.current = replyMode;

useEffect(() => {
  return () => {
    if (replyingToIdRef.current && replyTextRef.current.trim()) {
      localStorage.setItem('admin-reply-draft', JSON.stringify({
        id: replyingToIdRef.current,
        text: replyTextRef.current,
        mode: replyModeRef.current,
      }));
    }
  };
}, []);
```

2. Initialize state from localStorage on mount:

```typescript
const [replyingToId, setReplyingToId] = useState<string | null>(() => {
  try {
    const draft = localStorage.getItem('admin-reply-draft');
    if (draft) return JSON.parse(draft).id;
  } catch {}
  return null;
});

const [replyText, setReplyText] = useState(() => {
  try {
    const draft = localStorage.getItem('admin-reply-draft');
    if (draft) return JSON.parse(draft).text ?? "";
  } catch {}
  return "";
});

const [replyMode, setReplyMode] = useState<'edit' | 'new'>(() => {
  try {
    const draft = localStorage.getItem('admin-reply-draft');
    if (draft) return JSON.parse(draft).mode ?? 'new';
  } catch {}
  return 'new';
});
```

3. Add a one-time effect to expand the restored feedback item and clear the draft from storage:

```typescript
useEffect(() => {
  const draft = localStorage.getItem('admin-reply-draft');
  if (draft) {
    try {
      const { id } = JSON.parse(draft);
      if (id) setExpandedFeedbackIds(prev => new Set(prev).add(id));
    } catch {}
    localStorage.removeItem('admin-reply-draft');
  }
}, []);
```

4. Clear draft in `handleCancelReply` and `handleSendReply`:

```typescript
localStorage.removeItem('admin-reply-draft');
```

## Files modified
- `src/pages/Admin.tsx` -- persist/restore reply draft via localStorage on unmount/mount

