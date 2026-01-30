

## Update Demo Welcome Message

### Problem
The current welcome message says "try the editing experience" which is confusing since the demo is read-only and edits won't be saved. This sets an incorrect expectation for new users.

---

### Changes to `src/components/ReadOnlyOverlay.tsx`

#### Update Welcome Description (lines 36-39)

**Current text:**
> You're exploring with sample data. Browse around, try the editing experience, and see how everything works. Changes won't be saved.

**New text:**
> You're exploring with sample data. Browse around and see how everything works. Changes won't be saved.

This removes the confusing "try the editing experience" phrase while keeping the message clear and informative.

---

### Result
- Clearer expectation that this is a view-only demo
- Still communicates that users can explore freely
- Maintains the "changes won't be saved" warning

