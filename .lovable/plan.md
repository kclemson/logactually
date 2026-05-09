## Problem

In `DynamicChart` (`src/components/trends/DynamicChart.tsx`, lines 221–238), the note's `contentEditable` `<p>` renders its placeholder by stuffing `"Add a note..."` into its text content when `spec.aiNote` is empty:

```tsx
{spec.aiNote || "Add a note..."}
```

When the user taps to edit, the placeholder is *real text* inside the field, so it stays put while they type and they end up with `"Add a note...whatever I typed"` (or have to manually clear it first).

## Fix

Use a CSS-only placeholder via `:empty::before`, which is the standard pattern for contentEditable:

1. Render the `<p>` with empty content when `spec.aiNote` is falsy (instead of the literal placeholder string).
2. Add a `data-placeholder="Add a note..."` attribute.
3. Add a Tailwind arbitrary-variant class so the placeholder text is shown via a pseudo-element only when the element is empty:
   ```
   empty:before:content-[attr(data-placeholder)]
   empty:before:text-foreground/40
   empty:before:italic
   ```
   (Project convention — per memory — for ghost text is `placeholder:text-foreground/50 placeholder:italic`; for contentEditable we mirror that with `text-foreground/50` on the pseudo-element.)
4. Remove the `if (e.key === "Escape") ... e.currentTarget.textContent = spec.aiNote ?? ""` branch's reliance on the placeholder string — already correct since it sets to `""` when no note.

The pseudo-element is non-editable, so tapping to type produces a clean, empty caret position with the ghost label visible until the first keystroke.

### Concrete diff sketch

```tsx
<p
  contentEditable
  suppressContentEditableWarning
  spellCheck={false}
  data-placeholder="Add a note..."
  onBlur={...}
  onKeyDown={...}
  className="text-[10px] italic text-muted-foreground mt-1 px-0.5 leading-tight outline-none border-b border-dashed border-muted-foreground/30 focus:border-primary cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-foreground/50 empty:before:italic"
>
  {spec.aiNote || ""}
</p>
```

## Out of scope

- Title field — uses a separate input pattern; not affected.
- Read-only path (the `else` branch when no `onAiNoteChange`) — already correct.