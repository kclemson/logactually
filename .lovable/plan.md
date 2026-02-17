

# Fix: SimilarEntryPrompt UX -- Three Distinct Actions

## Problem
Currently, both the X button and "Log as New" call the same `onDismiss` handler (AI analysis). Users who just want to close the prompt get surprised when it triggers food logging. And if they re-submit the same text, the prompt reappears in an infinite loop.

## Solution

Three distinct actions with clear labels:
- **"Use past entry"** -- logs the matched historical items
- **"Log as new"** -- sends text to AI analysis and creates a new entry
- **"Cancel"** -- closes the prompt, keeps text in textarea, does nothing else

To prevent the re-prompt loop: track the dismissed input text so re-submitting skips the similarity check.

## Changes

### 1. `src/components/SimilarEntryPrompt.tsx`

- Add `onCancel: () => void` prop
- Remove the X button entirely
- Rename button labels: "Log this" becomes "Use past entry", keep "Log as new", add "Cancel"
- Wire: "Use past entry" calls `onUsePastEntry`, "Log as new" calls `onDismiss`, "Cancel" calls `onCancel`
- Remove the `X` import from lucide-react since it's no longer used

### 2. `src/pages/FoodLog.tsx`

**New state** (near other state declarations):
```typescript
const [dismissedMatchText, setDismissedMatchText] = useState<string | null>(null);
```

**New handler** `handleCancelEntryMatch`:
```typescript
const handleCancelEntryMatch = useCallback(() => {
  if (!pendingEntryMatch) return;
  setDismissedMatchText(pendingEntryMatch.originalInput);
  setPendingEntryMatch(null);
}, [pendingEntryMatch]);
```

**Update `handleSubmit`** (around line 248): add a check before the similarity detection block:
```typescript
// Skip similarity check if user already cancelled this exact input
if (dismissedMatchText === text) {
  setDismissedMatchText(null);
  // fall through to AI analysis below
} else if (!isReadOnly && recentEntries?.length) {
  // existing similarity detection logic...
}
```

**Clear dismissed text** when input changes -- add to the `handleSubmit` entry point so it only matters on exact re-submission.

**Pass new prop** in JSX:
```tsx
<SimilarEntryPrompt
  match={pendingEntryMatch.match}
  onUsePastEntry={handleUsePastEntry}
  onDismiss={dismissEntryMatch}
  onCancel={handleCancelEntryMatch}
  isLoading={isAnalyzing || createEntry.isPending}
/>
```

## Files changed

| File | What changes |
|---|---|
| `src/components/SimilarEntryPrompt.tsx` | Remove X button, add `onCancel` prop, rename button labels |
| `src/pages/FoodLog.tsx` | Add `dismissedMatchText` state, `handleCancelEntryMatch` handler, bypass check in `handleSubmit` |

~15 lines added/changed across 2 files.
