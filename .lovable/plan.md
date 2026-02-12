

## Replace Input with Textarea in Ask AI Dialog

### Change

Replace the single-line `<input>` element with a `<Textarea>` component in `src/components/AskTrendsAIDialog.tsx` so users can see their full prompt without clipping, both while typing and while waiting for a response.

### Technical Details

**File: `src/components/AskTrendsAIDialog.tsx`**

1. Import the existing `Textarea` component from `@/components/ui/textarea`.

2. Replace the `<input>` element (around lines 106-115) with a `<Textarea>`:
   - Remove `h-9` fixed height constraint
   - Use `min-h-[60px] max-h-[120px] resize-none` for a compact but multi-line area
   - Submit on Enter (without Shift) to preserve current UX; Shift+Enter for newlines
   - Keep all existing props (value, onChange, placeholder, disabled, maxLength, autoFocus)

3. Adjust the flex layout: change the container from `flex gap-2` (side-by-side) to a stacked layout with the button below or aligned to the bottom-right, since a textarea next to a button looks awkward.

4. During the `isPending` state, the textarea remains visible (disabled) showing the full question text without clipping, since the textarea naturally wraps long text.

| File | Change |
|------|--------|
| `src/components/AskTrendsAIDialog.tsx` | Replace `<input>` with `<Textarea>`, adjust layout for multi-line input |

