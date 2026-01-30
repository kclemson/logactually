

## Move Privacy & Security to "About" Section

### Overview

Create a new "About" CollapsibleSection at the bottom of the Settings page to house the Privacy & Security link. This gives it a proper semantic home and follows common app conventions.

---

### Changes

#### `src/pages/Settings.tsx`

**1. Add Info icon import:**
```tsx
import { ..., Info } from "lucide-react";
```

**2. Remove Privacy & Security from Account section:**

Remove the link from the header row that currently shows it next to "Delete account"

**3. Add new "About" CollapsibleSection after Export to CSV:**

```tsx
{/* About section - at the very bottom */}
<CollapsibleSection title="About" icon={Info} defaultOpen={true}>
  <div className="space-y-2">
    <Link
      to="/privacy"
      className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
    >
      Privacy & Security
    </Link>
  </div>
</CollapsibleSection>
```

---

#### `src/pages/Help.tsx`

**Apply consistent underline styling and remove "made by" credit:**

- Add `underline underline-offset-2` to the Privacy & Security link
- Remove the kcloadletter.com link

---

### Section Order (Final)

1. Account
2. Saved Meals
3. Saved Routines (if weight tracking enabled)
4. Preferences
5. Export to CSV
6. **About** (new)

---

### Future Extensibility

The About section could later include:
- App version number
- Link to changelog/release notes
- Link to Help page
- Credits/acknowledgments

