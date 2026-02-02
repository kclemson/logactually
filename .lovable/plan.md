
## Hide Feedback Form for Read-Only Users

### Problem
The Help page shows the feedback input form for demo mode users, but submitting feedback fails silently because the RLS policy blocks inserts for read-only users.

### Solution
Use `useReadOnlyContext` in `FeedbackForm` to conditionally hide the input section for read-only users. They can still see their feedback history (if any) and admin responses, but can't submit new feedback.

---

### File Changed

| File | Change |
|------|--------|
| `src/components/FeedbackForm.tsx` | Hide input form for read-only users |

---

### Code Changes

**Add import (line 1):**
```tsx
import { useReadOnlyContext } from "@/contexts/ReadOnlyContext";
```

**Get read-only state inside component (after line 40):**
```tsx
const { isReadOnly } = useReadOnlyContext();
```

**Wrap the input section in conditional (lines 67-85):**
```tsx
{!isReadOnly && (
  <div className="space-y-2">
    <Textarea
      placeholder={FEEDBACK_CONTENT.placeholder}
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      className="min-h-[80px] text-sm resize-none"
      maxLength={1000}
    />
    <div className="flex items-center gap-3">
      <Button size="sm" onClick={handleSubmit} disabled={!message.trim() || submitFeedback.isPending}>
        {submitFeedback.isPending ? FEEDBACK_CONTENT.submittingButton : FEEDBACK_CONTENT.submitButton}
      </Button>
      {showSuccess && (
        <span className="text-sm text-muted-foreground animate-in fade-in">
          {FEEDBACK_CONTENT.successMessage}
        </span>
      )}
    </div>
  </div>
)}
```

---

### Behavior

| User Type | Input Form | Feedback History |
|-----------|------------|------------------|
| Regular user | Shown | Shown (if any) |
| Demo/read-only | Hidden | Shown (if any) |

The header with "Feedback" title and icon remains visible so the section doesn't completely disappear. Read-only users see the section but just can't submit.
