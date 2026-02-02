

## Demo Preview Dialog Polish

Four refinements to improve the mobile experience and reduce promotional feel.

---

### Issue 1: Reduce Dialog Padding on Mobile

**Current**: `DialogContent` has `p-6` (24px) padding by default.

**Fix**: Override in `DemoPreviewDialog` to use tighter padding on mobile: `p-4` or even `p-3`, with `sm:p-6` to preserve desktop padding.

**Change**: Add `p-3 sm:p-6` to the `DialogContent` className override.

---

### Issue 2: Left-Align Text on Mobile

**Root Cause**: `DialogHeader` in the UI component has `text-center sm:text-left` - so on mobile it centers, desktop left-aligns.

**Fix**: Override the `DialogHeader` className in `DemoPreviewDialog` to always be left-aligned: `text-left`.

**Change**: Add `className="text-left"` to `<DialogHeader>`.

---

### Issue 3: Consistent Styling for Labels

**Current**: 
- "What you entered:" is `text-sm` (14px), muted color
- "Here's what would be logged:" uses `DialogTitle` with `text-title` (18px, semi-bold styling)

**Fix**: Don't use `DialogTitle` for "Here's what would be logged:". Instead, render both as simple styled text with the same treatment.

**Design**:
- Both labels: `text-sm text-muted-foreground` 
- Both quoted values: normal text, smaller

**Change**: Replace `<DialogTitle>` with a styled `<p>` matching the "What you entered" styling.

---

### Issue 4: Remove "Create Free Account" Button

**Rationale**: Demo mode should feel exploratory, not promotional.

**Fix**: Remove the `<Button onClick={handleCreateAccount}>Create Free Account</Button>` entirely. Keep only "Got it".

**Additional cleanup**: Remove the now-unused `handleCreateAccount` function and `useNavigate` import.

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/DemoPreviewDialog.tsx` | All 4 fixes |

---

### Technical Details

**Updated structure:**

```tsx
<DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto p-3 sm:p-6">
  <DialogHeader className="text-left">
    {rawInput && (
      <div className="text-sm mb-3">
        <span className="text-muted-foreground">What you entered:</span>
        <p className="mt-1 italic text-foreground">"{rawInput}"</p>
      </div>
    )}
    <p className="text-sm text-muted-foreground">Here's what would be logged:</p>
  </DialogHeader>

  <div className="py-2">
    {/* table... */}
  </div>

  <DialogFooter>
    <Button variant="outline" onClick={() => onOpenChange(false)}>
      Got it
    </Button>
  </DialogFooter>
</DialogContent>
```

**Imports cleanup:**
- Remove `useNavigate` (no longer navigating to auth)
- Remove `DialogTitle` from imports (no longer using it)
- Remove `supabase` import (no longer calling signOut)

