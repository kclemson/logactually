

## Add Changelog Entry for Feb-10

### Changes

**1. Copy the uploaded screenshot to `public/changelog/`**

Save `user-uploads://image-653.png` as `public/changelog/apple-health-import.png`.

**2. Add new entry to `src/pages/Changelog.tsx`**

Insert a new entry at the top of `CHANGELOG_ENTRIES` (line 24):

```
{ date: "Feb-10", text: "Added support for importing workouts from Apple Health. If you use an Apple Watch, export your exercise data on your phone and then import that XML file in Settings. Also improved general UX for cardio.", image: "apple-health-import.png" },
```

Update `LAST_UPDATED` from `"Feb-09-26"` to `"Feb-10-26"` (line 39).

**3. Update Settings link text (`src/pages/Settings.tsx`)**

Line 417: Change `Changelog (last updated Feb-09)` to `Changelog (last updated Feb-10)`.

