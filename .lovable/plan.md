

# Add Changelog Entry for Grouped Entries (Feb-17)

## Changes

### 1. Copy the uploaded screenshot
Copy `user-uploads://grouping_for_food.png` to `public/changelog/grouped-entries.png`.

### 2. `src/pages/Changelog.tsx`
- Add new entry at the top of `CHANGELOG_ENTRIES`:
  ```
  { date: "Feb-17", text: "Multi-item entries on both the Food Log and Exercise Log now collapse into a single row showing a group name with a chevron to expand. Tap to reveal individual items, edit the group name inline, or access 'Save as meal/routine' and batch delete. Food groups also support portion scaling — adjust the multiplier on the group header and all child items scale proportionally.", image: "grouped-entries.png" }
  ```
- Update `LAST_UPDATED` from `"Feb-16-26"` to `"Feb-17-26"`

### 3. `src/components/settings/AboutSection.tsx`
- Update the changelog link text from `"Changelog (last updated Feb-16)"` to `"Changelog (last updated Feb-17)"`

