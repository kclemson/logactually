

## Make "try the demo" Link Stand Out

### Overview

Add default underline styling to the "try the demo" link so it visually stands out as a clickable action, not just on hover.

---

### Current State (line 332-333)

```tsx
className="text-primary underline-offset-4 hover:underline disabled:opacity-50"
```

The link only shows underline on hover, making it look like plain text until interaction.

---

### Proposed Change

Add `underline` to the default state:

```tsx
className="text-primary underline underline-offset-4 hover:no-underline disabled:opacity-50"
```

This makes the link:
- Underlined by default (stands out as clickable)
- Removes underline on hover (subtle interaction feedback)
- Matches common hyperlink patterns users expect

---

### Alternative Option

If you'd prefer to keep hover-underline but add more emphasis:

```tsx
className="text-primary font-medium underline-offset-4 hover:underline disabled:opacity-50"
```

This makes it bold/medium weight instead of underlined.

---

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Add `underline` class to demo link (line 332) |

