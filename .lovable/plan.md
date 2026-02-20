
## Move "Thanks!" below the Photo/Screenshot links

### What the user wants

The success message should appear on a second line **below** the Photo and Screenshot buttons, still to the left of the Send Feedback button. The button is taller than the attachment links, so there's natural vertical space for this to sit cleanly underneath them.

```
[📎 Photo]  [📷 Screenshot a page]
Thanks for the feedback!                    [Send Feedback]
```

### How to implement it

The outer wrapper stays `flex items-start justify-between gap-3` (left group and button right-aligned and top-aligned).

The **left group** changes from `flex items-center gap-3` (single row) to `flex flex-col gap-1` (column), containing:
1. A `flex items-center gap-3` inner row for the two attachment buttons
2. The `{showSuccess && <span>...</span>}` message as the second row — only rendered when visible, so it takes up no space normally

The **right group** stays `flex-shrink-0` with just the Send button.

### Exact change in `src/components/FeedbackForm.tsx` (lines 277–341)

Replace:
```tsx
{/* Left: attachment controls */}
<div className="flex items-center gap-3 flex-wrap">
  ...buttons...
</div>

{/* Right: send button + success */}
<div className="flex items-center gap-3 flex-shrink-0">
  <Button ...>Send Feedback</Button>
  {showSuccess && <span>...</span>}
</div>
```

With:
```tsx
{/* Left: attachment controls + success message below */}
<div className="flex flex-col gap-1">
  <div className="flex items-center gap-3">
    ...buttons (unchanged)...
  </div>
  {showSuccess && (
    <span className="text-sm text-muted-foreground animate-in fade-in">
      {FEEDBACK_CONTENT.successMessage}
    </span>
  )}
</div>

{/* Right: send button only */}
<div className="flex-shrink-0">
  <Button ...>Send Feedback</Button>
</div>
```

### Also in the same pass: Changelog cache-busting

Add `?v=${LAST_UPDATED}` to all 4 image `src`/`onClick` expressions in `src/pages/Changelog.tsx` so dev mode always shows the latest screenshot when the changelog is updated.

### Files changed

| File | Change |
|---|---|
| `src/components/FeedbackForm.tsx` | Restructure left group to `flex-col`; move success message to second row below attachment buttons; simplify right group to button only |
| `src/pages/Changelog.tsx` | Add `?v=${LAST_UPDATED}` to all changelog image `src` and `setLightboxSrc` calls |
