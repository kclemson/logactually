

## Add Changelog Entry for Similar Entry Detection Feature

### Changes

**1. Copy the screenshot to public/changelog/**

Copy the uploaded image to: `public/changelog/similar-entry.png`

**2. Update `src/pages/Changelog.tsx`**

Add new entry at the top of `CHANGELOG_ENTRIES` array (line 20):
```typescript
{ date: "Feb-04", text: "Added smart detection for similar past food entries - when logging something you've had before, it'll suggest using your previous entry.", image: "similar-entry.png" },
```

Update `LAST_UPDATED` (line 31):
```typescript
const LAST_UPDATED = "Feb-04-26";
```

### Result
- New changelog entry with screenshot showing the "Use Past Entry" prompt
- Entry dated Feb-04 with descriptive text about the feature

