

## Standardize Changelog Entries to Single-Line Format

### Summary

Add a `// prettier-ignore` comment before the `CHANGELOG_ENTRIES` array and reformat all entries to be single-line, giving you full control over formatting.

### Changes to `src/pages/Changelog.tsx`

**Lines 10-34** - Add prettier-ignore and collapse all entries to single lines:

```tsx
// prettier-ignore
const CHANGELOG_ENTRIES = [
  { date: "Jan-31", text: "Added support for Google authentication, and this changelog page." },
  { date: "Jan-30", text: "Added (minimal) support for cardio exercises - instead of erroring out, it will now log the items and show a 'cardio' label, with simple charts for cardio exercises on the Trends page. Running/walking/cycling charts also support switching between time-based view and mph-based view." },
  { date: "Jan-28", text: "Added user setting to show weights in Kg vs Lbs." },
  { date: "Jan-27", text: "Added support for logging weight lifting exercises, saved routines, charts, and exporting the full weight lifting log to CSV. Refactored a bunch of code to be shared between Food and Weights. Also added 'demo mode', a read-only account that has pre-populated content in it so people can see the basic UI of the app without having to create an account." },
  { date: "Jan-26", text: "Added support for requesting additional food metadata from the model (fiber, sugar, saturated fat, sodium, cholesterol) but don't want to add them to the UI for now - but they're available in the exported CSV though" },
  { date: "Jan-25", text: "Added the ability to save meals (click/tap the > next to the logged food to access it) and then quickly add a saved meal to the log." },
  { date: "Jan-24", text: "Added barcode scanning support for logging food, and user setting for dark theme." },
  { date: "Jan-23", text: "It's alive! v1 of app published with support for food logging & AI integration, simple charts for trends over time, mobile & desktop layouts, PWA support for pinning to home screen." },
];
```

### Result

- Each entry stays on one line regardless of length
- Prettier won't reformat this section
- Easy to copy/paste new entries
- You can use horizontal scrolling in your editor to view long entries

