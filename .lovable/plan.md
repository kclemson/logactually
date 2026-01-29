

## Update "try the demo" Link Styling

### Overview

Remove the default underline from the demo link and use a blue color to make it stand out, creating visual consistency with the "Sign Up" link which also uses hover-underline.

---

### Current State (line 334)

```tsx
className="text-primary underline underline-offset-4 hover:no-underline disabled:opacity-50"
```

---

### Proposed Change

```tsx
className="text-blue-500 underline-offset-4 hover:underline disabled:opacity-50"
```

This makes the link:
- Blue color by default (`text-blue-500`) - stands out from the muted text
- No underline by default - matches the "Sign Up" link pattern
- Underline on hover - consistent interaction feedback

---

### Visual Result

```
Don't have an account? Sign Up     ← text-primary, hover:underline
Or try the demo — no account needed   ← text-blue-500, hover:underline
```

Both links now have the same underline behavior (hover only), but the demo link uses blue to differentiate it.

---

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Update demo link class: remove `underline`, change `text-primary` to `text-blue-500` |

