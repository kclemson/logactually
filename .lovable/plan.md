

## Add Bullet Point Parsing for `*` in AI Responses

### Problem

The AI returns `*` as bullet markers (e.g., `* **Weight Load Increases:** ...`), but the current regex-based rendering only handles `**bold**`. The `*` bullets render as raw text instead of proper list formatting.

### Change

**File:** `src/components/AskTrendsAIDialog.tsx` (around line 157)

Update the `dangerouslySetInnerHTML` processing chain to also convert lines starting with `*` (or `- `) into HTML list items. The approach:

1. After the existing HTML-escaping and bold parsing, add a step that detects lines beginning with `* ` or `- `
2. Wrap consecutive bullet lines in `<ul>` tags and each line in `<li>` tags
3. Add minimal styling for the list (e.g., `list-disc ml-4`) via the parent container's class

The updated processing pipeline:
- Escape `&`, `<`, `>` (existing)
- Convert `**text**` to `<strong>` (existing)
- **New:** Convert lines starting with `* ` or `- ` into `<ul><li>...</li></ul>` blocks

