

# Add changelog entry for "Copy to today" feature

## Changes

### 1. Copy screenshot to `public/changelog/`
- Copy `user-uploads://copy_to_today.png` to `public/changelog/copy-to-today.png`

### 2. `src/pages/Changelog.tsx`
- Add new entry at the top of `CHANGELOG_ENTRIES` (after the existing Feb-18 detail dialog entry):
  ```
  { date: "Feb-18", text: "Added 'Copy to today' — expand any past food or exercise entry and tap the link to instantly duplicate it to today's log. Shows a brief inline confirmation without interrupting your browsing.", image: "copy-to-today.png" }
  ```
- No change to `LAST_UPDATED` (already `"Feb-18-26"`)

### 3. No changes needed to `AboutSection.tsx`
- Already shows "last updated Feb-18"

