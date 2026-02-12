

## Gate "Ask AI" Buttons to Admin Users Only

### Change

Wrap the two "Ask AI" `headerAction` buttons in the Trends page so they only render for admin users. The `isAdmin` flag is already available in the component (from `useIsAdmin()`), so no new imports or hooks are needed.

### Technical Details

**File: `src/pages/Trends.tsx`**

1. **Line 700** -- Food Trends `headerAction`: Change from always rendering the "Ask AI" button to conditionally rendering it only when `isAdmin` is true.

2. **Line 774** -- Exercise Trends `headerAction`: Same conditional wrapping.

Both changes follow this pattern:
```tsx
// Before
headerAction={<button onClick={...}>Ask AI</button>}

// After
headerAction={isAdmin ? <button onClick={...}>Ask AI</button> : undefined}
```

The dialogs themselves (`AskTrendsAIDialog`) can remain as-is since they won't open without the button. The edge function already requires auth, so this is just a UI visibility gate consistent with the existing admin-gating pattern used elsewhere.

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Gate both "Ask AI" headerAction buttons behind `isAdmin` |

