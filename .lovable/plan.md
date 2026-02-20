
## Four feedback UX improvements in one pass

### Change 1 — Attachment row layout (FeedbackForm.tsx)

Replace the two separate blocks (attachment buttons row + send button row) with a single `flex items-start justify-between` row:

```
[📎 Photo]  [📷 Screenshot a page]          [Send Feedback]
```

- Left side: `flex items-center gap-3` containing the two attachment buttons. The separator dot `·` is removed — gap-3 is sufficient visual separation.
- "Attach photo" shortened to **"Photo"** to save width.
- Right side: `flex-shrink-0` Send button + success message.
- `items-start` so both sides top-align if the left side wraps on very narrow screens.

The thumbnail preview block remains below this row (unchanged).

---

### Change 2 — FeedbackMessageBody: lightbox instead of new tab

`FeedbackImage` currently wraps the image in `<a href={url} target="_blank">`. This opens a new browser tab in both the user's feedback history and the admin portal.

Replace it with a self-contained lightbox component matching the pattern from `FeedbackForm`:

- Add `lightboxOpen` state inside `FeedbackImage`
- Clicking the thumbnail sets `lightboxOpen(true)` — image gets `cursor-zoom-in`
- Overlay: `fixed inset-0 z-50 bg-black/80 flex items-center justify-center`
- Inner wrapper: `relative` with `onClick={(e) => e.stopPropagation()}`
- Close button: `absolute -top-3 -right-3 bg-background rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors shadow-md z-10` — hugs the image corner
- Escape key handler via `useEffect` (only active when `lightboxOpen` is true)
- Thumbnail display: `max-h-64 w-auto rounded border border-border object-contain cursor-zoom-in hover:opacity-90 transition-opacity` (matches existing size)
- The `<a>` wrapper is removed entirely

Since `FeedbackMessageBody` is shared between user history and admin portal, both benefit automatically from a single change.

---

### Change 3 — Image indicator icon on collapsed rows

Add a small `ImageIcon` (from lucide-react) immediately after the `#id` span in collapsed header rows, visible only when the item has an `image_url`. This signals an attachment before the user expands.

**`src/components/FeedbackForm.tsx`** — user history collapsed row (line ~408):
```tsx
<span className="text-muted-foreground font-mono">#{item.feedback_id}</span>
{item.image_url && (
  <ImageIcon className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
)}
```

**`src/pages/Admin.tsx`** — open feedback collapsed row (line ~467):
```tsx
<span className="text-muted-foreground font-mono">#{f.feedback_id}</span>
{f.image_url && (
  <ImageIcon className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
)}
```

**`src/pages/Admin.tsx`** — resolved feedback collapsed row (line ~588):
```tsx
<span className="text-muted-foreground font-mono">#{f.feedback_id}</span>
{f.image_url && (
  <ImageIcon className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
)}
```

`ImageIcon` is imported from `lucide-react` in each file that needs it.

---

### Files changed

| File | Changes |
|---|---|
| `src/components/FeedbackForm.tsx` | Merge attachment + send into one row; shorten "Attach photo" → "Photo"; remove separator dot; add `ImageIcon` to collapsed history rows |
| `src/components/FeedbackMessageBody.tsx` | Replace `<a target="_blank">` on `FeedbackImage` with self-contained lightbox (state + overlay + Escape handler + corner X button) |
| `src/pages/Admin.tsx` | Add `ImageIcon` indicator to both open and resolved collapsed feedback rows; import `ImageIcon` from lucide-react |
