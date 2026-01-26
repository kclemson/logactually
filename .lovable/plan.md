

## Shorten Auth Page Tagline

### Overview
Update the sign-in page tagline to a shorter version that fits on one line on mobile screens.

---

### Changes to `src/pages/Auth.tsx`

**Update the CardDescription in the main sign-in/sign-up form:**
- Before: `{APP_DESCRIPTION}` → "Braindump what you ate, and AI handles the nutrition math"
- After: Hardcoded string → "Braindump what you ate — AI handles the rest"

---

### Visual Result

```text
Before (wraps on mobile):           After (single line):
+----------------------+            +----------------------+
|     Log Actually     |            |     Log Actually     |
| Braindump what you   |            | Braindump what you   |
| ate, and AI handles  |            | ate — AI handles the |
| the nutrition math   |            | rest                 |
+----------------------+            +----------------------+
```

---

### Code Change

```tsx
// Line ~254 in Auth.tsx - main sign-in/sign-up form
<CardDescription>
  Braindump what you ate — AI handles the rest
</CardDescription>
```

---

### Notes

- Using an em dash (—) instead of hyphen (-) for better typography
- Keep `APP_DESCRIPTION` unchanged in constants.ts for OpenGraph/SEO purposes
- The auth page uses a shorter, punchier version for better mobile UX
- Password reset views keep their functional descriptions unchanged

---

### Files Changed

| File | Action |
|------|--------|
| `src/pages/Auth.tsx` | Replace `{APP_DESCRIPTION}` with shorter hardcoded string |

