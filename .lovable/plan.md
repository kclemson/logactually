

## Add changelog entry and update settings date

### 1. `src/pages/Changelog.tsx`
- Add new entry at top of `CHANGELOG_ENTRIES`:
  ```tsx
  { date: "Feb-27", text: "Saved meals and brand names are now searchable in the typeahead — type part of a saved meal name or brand and it'll appear as a suggestion.", image: undefined },
  ```
- Update `LAST_UPDATED` from `"Feb-19-26"` to `"Feb-27-26"`.

### 2. `src/components/settings/AboutSection.tsx`
- Update changelog link text from `"Changelog (last updated Feb-19)"` to `"Changelog (last updated Feb-27)"`.

