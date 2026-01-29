

## Extract Help Page Strings for Easy Editing

### Overview
Move all user-facing strings from the Help page into a dedicated constants object at the top of the file. This makes them easy to find and edit without digging through JSX.

---

### Changes

**File:** `src/pages/Help.tsx`

Add a `HELP_CONTENT` object at the top of the file containing all editable strings:

```tsx
const HELP_CONTENT = {
  tips: {
    title: 'Tips',
    items: [
      {
        text: 'Log food and weight lifting now. More tracking types coming soon.',
        highlights: ['food', 'weight lifting'],
      },
      {
        text: 'Just braindump your inputs however you want — the AI figures out the formatting.',
        highlights: ['braindump'],
      },
      {
        text: 'Editing calories auto-scales protein, carbs, and fat proportionally.',
        highlights: ['calories'],
      },
    ],
  },
  feedback: {
    title: 'Feedback',
    placeholder: 'Feature requests, bugs, or ideas...',
    submitButton: 'Send Feedback',
    submittingButton: 'Sending...',
    successMessage: 'Thanks for the feedback!',
  },
};
```

The component will then render from this object, applying the highlight styling to specified words automatically.

---

### Files to Modify
1. `src/pages/Help.tsx` - Extract strings to a constants object at the top

