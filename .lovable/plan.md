

## Add Changelog Entry for Portion Scaling

### 1. Copy screenshot
Copy `user-uploads://image-825.png` to `public/changelog/portion-scaling.png`

### 2. Add changelog entry
In `src/pages/Changelog.tsx`, add a new entry at the top of the `CHANGELOG_ENTRIES` array:

```
{ date: "Feb-14", text: "Added portion scaling — tap any portion label to adjust it with +/- controls. Scales the quantity, unit, and all nutritional values proportionally. Great for when you had a bigger or smaller serving than what was originally logged.", image: "portion-scaling.png" }
```

### 3. Update LAST_UPDATED
`LAST_UPDATED` is already `"Feb-14-26"` so no change needed there. The existing Feb-14 custom logging entry stays as-is; this new entry goes above it as the first item in the array.

