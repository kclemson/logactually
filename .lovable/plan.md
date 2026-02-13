

## Cache Ask AI Prompt Eval state in localStorage

Persist the food prompts, exercise prompts, and results array so they survive page navigations and refreshes.

### Changes

**`src/components/AskAiPromptEval.tsx`**

- Food and exercise prompt text already use localStorage (`askai-food-prompts`, `askai-exercise-prompts`) for initialization -- no change needed there.
- Add localStorage persistence for the `results` array:
  - Initialize `results` state from `localStorage.getItem('askai-eval-results')` (JSON-parsed, defaulting to `[]`)
  - Save results to localStorage whenever they change: move the save into the `setResults` calls inside `runAll` and at the end of the run
  - Use a wrapper function like `updateResults` that both sets state and writes to localStorage, avoiding a useEffect
- Storage key: `askai-eval-results`

### Technical detail

```tsx
// Helper to persist results
const updateResults = (next: AskAiResult[]) => {
  setResults(next);
  localStorage.setItem('askai-eval-results', JSON.stringify(next));
};

// Replace all setResults([...allResults]) calls with updateResults([...allResults])
```

The `approved` toggle also needs to persist:

```tsx
const toggleApproved = (idx: number) => {
  const next = results.map((r, i) => i === idx ? { ...r, approved: !r.approved } : r);
  updateResults(next);
};
```

No other files need changes.

