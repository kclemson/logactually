

## Strip Smart Quotes from "Copy Approved" Output

When copying approved prompts, replace curly/smart quotes (`\u201C` and `\u201D`) with straight quotes (`"`) so the output is valid JS.

### Change

**File: `src/components/AskAiPromptEval.tsx`** -- in the `copyApproved` function, sanitize each prompt string before formatting:

```tsx
const copyApproved = (mode: 'food' | 'exercise') => {
    const approved = results
      .filter(r => r.mode === mode && r.approved)
-     .map(r => `  "${r.prompt}",`);
+     .map(r => {
+       const clean = r.prompt.replace(/[\u201C\u201D]/g, '"');
+       return `  "${clean}",`;
+     });
    if (approved.length === 0) return;
    navigator.clipboard.writeText(approved.join('\n'));
  };
```

Single change, one file.

