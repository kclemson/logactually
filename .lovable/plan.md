

## Improve Changelog Image Styling

### Problem
Currently, changelog images appear full-width and are not indented to align with the entry text. They also have no height constraint, potentially dominating the UI.

### Changes

**File: `src/pages/Changelog.tsx`**

Update the list item structure to wrap both text and image in a flex column, so the image aligns with the text (not the date):

Current structure (lines 63-73):
```tsx
<li key={index} className="text-sm">
  <div className="flex gap-2">
    <span className="...">{entry.date}:</span>
    <span className="...">{entry.text}</span>
  </div>
  {entry.image && (
    <img src={...} className="mt-2 ..." />
  )}
</li>
```

New structure:
```tsx
<li key={index} className="text-sm">
  <div className="flex gap-2">
    <span className="...">{entry.date}:</span>
    <div className="flex flex-col">
      <span className="...">{entry.text}</span>
      {entry.image && (
        <img 
          src={...} 
          className="mt-2 rounded-lg border border-border max-h-64 w-auto" 
        />
      )}
    </div>
  </div>
</li>
```

Key styling changes:
- Move image inside a `flex flex-col` wrapper alongside the text
- Add `max-h-64` (256px) to constrain image height
- Change from `max-w-full` to `w-auto` so width scales with height constraint

### Result
- Images will be left-aligned with entry text, indented past the date column
- Images capped at 256px height to avoid dominating the changelog

