

## Remove "Settings" Title from Settings Page

### Goal

Remove the redundant "Settings" heading at the top of the Settings page. The page context is already clear from the navigation, so the heading adds unnecessary visual weight.

### Change

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | Remove line 56: `<h2 className="text-title">Settings</h2>` |

### Implementation

Delete the `<h2>` element on line 56:

```tsx
// Before (lines 54-57)
return (
  <div className="space-y-6">
    <h2 className="text-title">Settings</h2>    // ← Remove this line

    {/* Saved Meals - frequently accessed */}

// After
return (
  <div className="space-y-6">
    {/* Saved Meals - frequently accessed */}
```

The "Saved Meals" section will now appear at the top of the page, with the section headings providing clear context for each settings group.

