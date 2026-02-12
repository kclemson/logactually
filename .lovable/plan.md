

## "New Changelog" Indicator in the Header

**Approach**: Use `localStorage` to track the last changelog version the user has seen. Compare it against the `LAST_UPDATED` constant. If they differ, show a subtle indicator in the header that links to the changelog.

### How it works

1. **Export `LAST_UPDATED`** from `src/pages/Changelog.tsx` so other components can reference it.

2. **Create a small hook** `src/hooks/useChangelogNew.ts`:
   - Reads `localStorage` key `changelog-last-seen`
   - Compares it to `LAST_UPDATED`
   - Returns `{ isNew: boolean, markSeen: () => void }`
   - `markSeen` writes `LAST_UPDATED` to localStorage, clearing the indicator

3. **Update `src/components/Header.tsx`**:
   - Add a small "New" text link next to the app name (or between the title and the Help link)
   - Style: subtle, muted text with a small dot -- similar to how the unread feedback dot works on the Help icon, but as a small clickable "New" label
   - Clicking it navigates to `/changelog` and calls `markSeen()`
   - Only renders when `isNew` is true

### Visual design

The indicator would appear as a small, understated "New" badge next to the app title:

```
[icon] LogActually  * New          Help [?]
```

- Small dot + "New" text in `text-xs text-muted-foreground` 
- On click: navigate to `/changelog` and dismiss
- Not animated, not colorful -- just subtly present

### Files changed

| File | Change |
|---|---|
| `src/pages/Changelog.tsx` | Export `LAST_UPDATED` constant |
| `src/hooks/useChangelogNew.ts` | New hook (~15 lines) |
| `src/components/Header.tsx` | Add conditional "New" link |

Three small changes, no backend needed. Pure client-side with localStorage persistence.
