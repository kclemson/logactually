Add a changelog entry for the Calendar monthly-summary row.

1. Create a Lovable Assets pointer for the uploaded screenshot (`user-uploads://image-1785708372.png`) at `src/assets/changelog-calendar-summary.png.asset.json`.
2. In `src/pages/Changelog.tsx`:
   - Import the new asset pointer.
   - Add a new top entry to `CHANGELOG_ENTRIES`:
     - date: `"Aug-02"`
     - text: `"added a short summary of the number of days that food or exercise was logged in a given month to the Calendar view"`
     - image: asset URL from the imported pointer
   - Keep `LAST_UPDATED` as `"Aug-02-26"` (already current).
3. Verify the new entry renders at the top of the Changelog page and the screenshot is legible on desktop and mobile.
