

# Fix feedback list UX issues

Two small changes in `src/components/FeedbackForm.tsx`:

## 1. Allow multiple items to be expanded at once

Change `expandedId` from a single string to a Set of strings, so clicking one item doesn't collapse another.

- `const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());`
- `toggleExpand` toggles the clicked ID in/out of the set
- `isExpanded` checks `expandedIds.has(item.id)`

## 2. Reduce font size on expanded message body

Change the expanded message text and response text from `text-sm` to `text-xs` to match the rest of the compact feedback UI.

- Line 178: `<p className="text-sm ...">` becomes `text-xs`
- Line 185: `<p className="text-sm ...">` becomes `text-xs`

## Technical details

**File: `src/components/FeedbackForm.tsx`**

| Line | Current | New |
|------|---------|-----|
| 39 | `const [expandedId, setExpandedId] = useState<string \| null>(null);` | `const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());` |
| 83-89 | `toggleExpand` sets single ID or null | Toggles ID in/out of a `Set` copy |
| 133 | `const isExpanded = expandedId === item.id;` | `const isExpanded = expandedIds.has(item.id);` |
| 178 | `text-sm` on message body | `text-xs` |
| 185 | `text-sm` on response body | `text-xs` |

No other files changed.

