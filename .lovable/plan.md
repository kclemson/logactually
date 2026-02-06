

## Plan: Add Feb-05 Changelog Entry

### Overview
Add a new changelog entry for today's date with the uploaded screenshot showcasing the "Save as Meal" dialog with item selection.

### Image Handling
- Copy the uploaded screenshot to `public/changelog/save-meal-select-items.png`

### Changelog Entry

**Date**: Feb-05

**Proposed text** (polished from your draft):
> "The 'Save as Meal' and 'Save as Routine' shortcuts now let you include other items logged on the same day. Also added color-coded 'Add' buttons—blue for food, purple for exercise—to make it easier to tell which page you're on."

This version:
- Keeps it concise (matches existing entry lengths)
- Leads with the feature, not the action ("now let you" vs "updated to let you")
- Uses "color-coded" to explain the purpose clearly
- Drops "routines" from the second sentence to avoid repetition with "Save as Routine"

### Files to Modify

| File | Change |
|------|--------|
| `public/changelog/save-meal-select-items.png` | Copy uploaded image |
| `src/pages/Changelog.tsx` | Add new entry at top of `CHANGELOG_ENTRIES` array and update `LAST_UPDATED` to "Feb-05-26" |

### New Entry Code
```tsx
{ date: "Feb-05", text: "The 'Save as Meal' and 'Save as Routine' shortcuts now let you include other items logged on the same day. Also added color-coded 'Add' buttons—blue for food, purple for exercise—to make it easier to tell which page you're on.", image: "save-meal-select-items.png" },
```

