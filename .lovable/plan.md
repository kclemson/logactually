

## Add Changelog Entry for Pinned Chats

### Changes

1. **Copy the uploaded screenshot** to `public/changelog/pinned-chats.png`

2. **`src/pages/Changelog.tsx`** -- Add a new entry at the top of `CHANGELOG_ENTRIES`:
   ```
   { date: "Feb-18", text: "Added the ability to pin AI responses on the Trends page for later reference. Pinned chats are accessible from the pin icon next to 'Ask AI', with the count shown as a badge.", image: "pinned-chats.png" }
   ```

3. **`src/pages/Changelog.tsx`** -- Update `LAST_UPDATED` from `"Feb-18-26"` to remain the same since it's already Feb-18 (no change needed).

