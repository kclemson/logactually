

## Show Last-Updated Date in Changelog Link on Settings Page

### Changes

**1. `src/pages/Settings.tsx`** (line ~421)

Update the changelog link text to include the last-updated date:

```tsx
Changelog (last updated Feb-09)
```

**2. `src/pages/Changelog.tsx`** -- Add a reminder comment at the top of the file

Add a prominent comment near the `LAST_UPDATED` constant reminding to also update `Settings.tsx` whenever the changelog is modified:

```tsx
// NOTE: When updating LAST_UPDATED, also update the changelog link text
// in src/pages/Settings.tsx which displays this date to users.
```

This way, any time the changelog file is edited, the comment will be visible and serve as a reminder to keep both locations in sync.

### Files Changed
- `src/pages/Settings.tsx` -- update link text
- `src/pages/Changelog.tsx` -- add reminder comment

