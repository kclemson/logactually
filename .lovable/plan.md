

# Add changelog entry for Detail Dialog feature

## Changes

### 1. Copy screenshot to `public/changelog/`
- Copy `user-uploads://detailed_dialog_view.png` to `public/changelog/detailed-dialog.png`

### 2. `src/pages/Changelog.tsx`
- Add new entry at the top of `CHANGELOG_ENTRIES`:
  ```
  { date: "Feb-18", text: "Added a detail view for logged food and exercise items — tap 'Details' in the expanded panel to see all fields at a glance, or switch to edit mode to update values directly. Uses a two-column layout on wider screens with dropdowns for category fields.", image: "detailed-dialog.png" }
  ```
- Update `LAST_UPDATED` from `"Feb-17-26"` to `"Feb-18-26"`

### 3. `src/components/settings/AboutSection.tsx`
- Update the changelog link text from `"Changelog (last updated Feb-17)"` to `"Changelog (last updated Feb-18)"`

