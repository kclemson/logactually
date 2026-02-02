

## Make Feedback Section Collapsible

### Overview
Wrap the feedback section on the Admin page in a `CollapsibleSection` component, collapsed by default, to reduce visual clutter.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Wrap feedback content in `CollapsibleSection` |

---

### Implementation

**1. Add import:**
```typescript
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { MessageSquare } from "lucide-react";
```

**2. Replace the feedback section (lines 277-334):**

Before:
```tsx
{feedback && feedback.length > 0 && (
  <div className="space-y-1">
    <p className="font-medium text-xs text-muted-foreground">Recent Feedback</p>
    {feedback.map((f) => (
      // ... feedback items
    ))}
  </div>
)}
```

After:
```tsx
{feedback && feedback.length > 0 && (
  <CollapsibleSection
    title={`Feedback (${feedback.length})`}
    icon={MessageSquare}
    defaultOpen={false}
    storageKey="admin-feedback"
    iconClassName="text-muted-foreground"
  >
    <div className="space-y-1">
      {feedback.map((f) => (
        // ... feedback items (unchanged)
      ))}
    </div>
  </CollapsibleSection>
)}
```

---

### Result

- Feedback section collapsed by default
- Shows count in header: "Feedback (12)"
- State persisted via localStorage key `section-admin-feedback`
- Uses muted icon color to match admin page styling

