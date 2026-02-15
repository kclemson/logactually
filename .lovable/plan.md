

# Persist Feedback Expansion State in localStorage

A small quality-of-life fix: remember which feedback items the user has expanded so they don't lose their place when navigating away and back.

## Approach

Modify `FeedbackForm.tsx` to persist `expandedIds` in localStorage, following the same event-driven pattern used by `CollapsibleSection`:

1. **Initialize from localStorage** -- read `feedback-expanded-ids` on mount to restore previously expanded items
2. **Write on toggle** -- in `toggleExpand`, persist the updated set to localStorage immediately (no useEffect)
3. **Clean up stale IDs** -- when feedback data loads, filter out any persisted IDs that no longer exist in the user's feedback history (items that were deleted)

## Technical Details

**File**: `src/pages/FeedbackForm.tsx` -- changes to ~3 spots:

- **Line 41** -- change `useState<Set<string>>(new Set())` to initialize from localStorage:
  ```ts
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('feedback-expanded-ids');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  ```

- **`toggleExpand` function (~line 83)** -- add localStorage write after updating state:
  ```ts
  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedIds(next);
    // Persist
    if (next.size > 0) {
      localStorage.setItem('feedback-expanded-ids', JSON.stringify([...next]));
    } else {
      localStorage.removeItem('feedback-expanded-ids');
    }
    // ... rest of existing logic
  };
  ```

- **After delete** -- clear the deleted ID from persisted state too (already handled since toggleExpand won't fire, but the item disappears from the list; stale IDs are harmless and get cleaned up on next load)

No new dependencies, no useEffect, consistent with the app's event-driven persistence pattern.

