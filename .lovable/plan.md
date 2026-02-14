

## Add Custom Logs Changelog Entry

### Changes

**1. Copy screenshot to public/changelog/**

Copy `user-uploads://custom_logs.png` to `public/changelog/custom-logs.png`

**2. Update `src/pages/Changelog.tsx`**

Add a new entry at the top of `CHANGELOG_ENTRIES`:

```typescript
{ date: "Feb-15", text: "Added custom logging — track anything beyond food and exercise. Enable it in Settings to create your own log types (body weight, measurements, mood, journal notes, and more). Supports numeric, text + numeric, and text entries with optional units. Custom logs get their own trends charts on the Trends page.", image: "custom-logs.png" },
```

Update `LAST_UPDATED` to `"Feb-15-26"`.

**3. Update `src/pages/Settings.tsx`**

Update the changelog link text to reflect the new last-updated date.

