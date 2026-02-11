

## Add Changelog Entry for Photo Food Logging

### What's changing
A new changelog entry will be added at the top of the list describing the photo-based food logging feature, using the uploaded screenshot as the accompanying image. The "last updated" date references in both the Changelog page and Settings page will be updated to Feb-11.

### Steps

1. **Copy the uploaded image** to `public/changelog/photo-food-logging.png`

2. **`src/pages/Changelog.tsx`** -- Add new entry + update date
   - Add a new entry at the top of `CHANGELOG_ENTRIES`:
     ```
     { date: "Feb-11", text: "Added photo-based food logging — snap a photo or choose one from your gallery, and AI will identify the food items, estimate portions, and log the nutritional breakdown automatically.", image: "photo-food-logging.png" }
     ```
   - Update `LAST_UPDATED` from `"Feb-10-26"` to `"Feb-11-26"`

3. **`src/pages/Settings.tsx`** (line 417) -- Update link text
   - Change `Changelog (last updated Feb-10)` to `Changelog (last updated Feb-11)`

### Files Changed
1. `public/changelog/photo-food-logging.png` -- new (copied from upload)
2. `src/pages/Changelog.tsx` -- new entry + updated `LAST_UPDATED`
3. `src/pages/Settings.tsx` -- updated changelog link text

