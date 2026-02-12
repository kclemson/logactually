

## Strip Double Quotes from Copy Approved Output

When copying approved prompts, remove any literal double-quote characters from the prompt text itself so the output doesn't break the JS string syntax.

### Change

**File: `src/components/AskAiPromptEval.tsx`** -- in the `copyApproved` function, add `.replace(/"/g, '')` to the cleaning chain:

```tsx
// Current (line ~88)
const clean = r.prompt.replace(/[\u201C\u201D]/g, '"');

// Updated
const clean = r.prompt.replace(/[\u201C\u201D"/g, '');
```

This strips smart quotes AND standard double quotes from the prompt text before wrapping it in the output quotes. Single change, one line.

