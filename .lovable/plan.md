# Changelog entry: Quick Add

## What to add

A new top entry in the changelog (dated Aug-02) announcing Quick Add, with the two uploaded screenshots shown side by side.

Proposed text:

"New "Quick Add" feature - if there's a saved meal or exercise routine you tend to log very frequently (such as a morning coffee, or twice a week leg day), it'll show up in ghost text at the bottom of the page, just tap/click on it once to add it. The Quick Add list is populated automatically with items you log very frequently, but you can also manually add something to the list in Settings."

## Technical details

- Copy the two uploaded images into `public/changelog/` as `quick-add-food.png` and `quick-add-exercise.png`.
- In `src/pages/Changelog.tsx`, insert the new entry at the top of `CHANGELOG_ENTRIES` using the `images: [...]` array form (renders side by side), and bump `LAST_UPDATED` to `"Aug-02-26"` so the "new" badge (`useChangelogNew`) fires for users.
- No other files change; the Settings link to the changelog has no hardcoded date.
