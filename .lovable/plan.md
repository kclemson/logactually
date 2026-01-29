

## Add "Pin to Home Screen" Tip to Help Page

### Overview
Add a new bullet point to the Tips section explaining how users can install the app to their phone's home screen for a native app-like experience.

---

### Changes

**File:** `src/pages/Help.tsx`

Add a new item to the `HELP_CONTENT.tips.items` array (around line 22):

```tsx
{
  text: "Pin this app to your phone's home screen for quick access — tap Share (or your browser menu), then \"Add to Home Screen.\"",
  highlights: ["Pin this app"],
},
```

---

### Placement
The tip will be added at the end of the existing tips list, after the "Export to CSV" tip. This feels like a natural place since it's about app usage/setup rather than core logging features.

---

### Files to Modify
1. `src/pages/Help.tsx` - Add new tip item to HELP_CONTENT.tips.items array

