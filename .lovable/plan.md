

## Add "Made by" Link to Help Page

### Overview
Add a horizontally centered link at the bottom of the Help page that says "made by kcloadletter.com" and links to https://www.kcloadletter.com.

---

### Design
Based on the reference image, the link should be:
- Muted/subtle text color (using `text-muted-foreground`)
- Small text size (`text-sm`)
- Horizontally centered
- Opens in a new tab for external links

---

### Changes

**File:** `src/pages/Help.tsx`

Add a new section at the bottom of the page after the Feedback section:

```tsx
{/* Made by link */}
<div className="pt-4 text-center">
  <a
    href="https://www.kcloadletter.com"
    target="_blank"
    rel="noopener noreferrer"
    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
  >
    made by kcloadletter.com
  </a>
</div>
```

---

### Files to Modify
1. `src/pages/Help.tsx` - Add centered "made by" link at the bottom

