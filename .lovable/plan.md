# Changelog entry: Quick Add

## What to add

A new top entry in the changelog (dated Aug-02) announcing Quick Add, with the two uploaded screenshots shown side by side.

Proposed text:

"Added Quick Add — saved meals and routines you log habitually now appear as a one-tap ghost row under your log for the day, so re-logging a regular breakfast or leg day is a single tap. Items are detected automatically from your recent logging patterns, and you can pin or remove any saved meal/routine from Quick Add via the pin icon in Settings or the ... menu on the row. Turn the whole feature on or off in Settings."

## Technical details

- Copy the two uploaded images into `public/changelog/` as `quick-add-food.png` and `quick-add-exercise.png`.
- In `src/pages/Changelog.tsx`, insert the new entry at the top of `CHANGELOG_ENTRIES` using the `images: [...]` array form (renders side by side), and bump `LAST_UPDATED` to `"Aug-02-26"` so the "new" badge (`useChangelogNew`) fires for users.
- No other files change; the Settings link to the changelog has no hardcoded date.
