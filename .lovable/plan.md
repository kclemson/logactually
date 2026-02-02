
## Hide Entire Feedback Section for Read-Only Users

### Problem
The Feedback section currently shows the header and feedback history for read-only users, but since they can't submit feedback and the demo account has no feedback history, the section is empty and confusing.

### Solution
Hide the entire `FeedbackForm` component when the user is read-only by returning `null` early.

---

### File Changed

| File | Change |
|------|--------|
| `src/components/FeedbackForm.tsx` | Return null for read-only users |

---

### Code Changes

**Add early return after line 42:**
```tsx
const { isReadOnly } = useReadOnlyContext();

// Hide entire section for read-only users
if (isReadOnly) {
  return null;
}
```

This is cleaner than wrapping the entire section in a conditional because:
1. The feedback history would also be empty for demo users
2. There's no value in showing an empty "Feedback" header
3. It simplifies the component logic

---

### Result

| User Type | Feedback Section |
|-----------|------------------|
| Regular user | Visible (input + history) |
| Demo/read-only | Hidden completely |
