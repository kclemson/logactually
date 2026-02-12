

## Show Original Prompt Above AI Response

**File: `src/components/AskTrendsAIDialog.tsx`**

Two small changes:

1. **Track the submitted question in state**: Add a `submittedQuestion` state variable. Set it in `handleSubmit` and clear it in `handleAskAnother`.

2. **Render it above the response**: When `data?.answer` is shown, display the original prompt in muted gray text above the AI answer.

```tsx
// Add state
const [submittedQuestion, setSubmittedQuestion] = useState("");

// In handleSubmit, save the question
const handleSubmit = (question: string) => {
  if (!question.trim() || isPending) return;
  reset();
  setSubmittedQuestion(question.trim());
  mutate({ ... });
};

// In handleAskAnother, clear it
const handleAskAnother = () => {
  reset();
  setInput("");
  setSubmittedQuestion("");
};

// In the response section, above the answer div:
{data?.answer && (
  <div className="space-y-3">
    {submittedQuestion && (
      <p className="text-xs text-muted-foreground italic">"{submittedQuestion}"</p>
    )}
    <div className="text-xs text-foreground whitespace-pre-wrap ...">
      ...
    </div>
    ...
  </div>
)}
```

One file, three small edits. The submitted question appears in gray italic text at the top of the response area.

