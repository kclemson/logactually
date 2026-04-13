

## Updated changelog entry — remove net carbs sentence

### Changes

**1. Copy uploaded screenshot**
`user-uploads://image-1776118110.png` → `public/changelog/display-macros.png`

**2. `src/pages/Changelog.tsx`**
- Add entry at top of `CHANGELOG_ENTRIES`:
```ts
{ date: "Apr-13", text: "Added configurable display macros — choose which 3 macros (protein, carbs, fat, fiber, sugar, net carbs, saturated fat, sodium) appear in your food tables and charts. Set your preference in Settings under Display Macros.", image: "display-macros.png" },
```
- Update `LAST_UPDATED` to `"Apr-13-26"`

**3. `src/components/settings/AboutSection.tsx`**
- Update changelog link text to `Changelog (last updated Apr-13)`

