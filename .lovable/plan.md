

# Add changelog entry for "First day of week" setting

## Changes

### 1. Copy the uploaded screenshot
Copy `user-uploads://image-1771393489.png` to `public/changelog/first-day-of-week.png` so it can be referenced by the changelog entry.

### 2. `src/pages/Changelog.tsx`
Add a new entry at the top of `CHANGELOG_ENTRIES`:

```tsx
{ date: "Feb-17", text: "Added a 'First day of week' preference in Settings — choose Sunday or Monday, and it'll be reflected in the Calendar view on the History page and the date picker on the Food, Exercise, and Custom log pages.", image: "first-day-of-week.png" },
```

No other files need changes since `LAST_UPDATED` is already `"Feb-17-26"`.

| File | What |
|------|------|
| `public/changelog/first-day-of-week.png` | Save uploaded screenshot |
| `src/pages/Changelog.tsx` | Add new entry to top of array |

