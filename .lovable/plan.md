
## Add Close Button to Help Page

### Overview
Add an X (close) button to the Help page that navigates back to the previous page, providing an intuitive way to dismiss the help content.

---

### Changes

**File:** `src/pages/Help.tsx`

Add a close button at the top-right of the page that uses `useNavigate(-1)` to go back:

```tsx
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export default function Help() {
  const navigate = useNavigate();
  // ... existing state

  return (
    <div className="space-y-6 relative">
      {/* Close button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute right-0 top-0 p-2 -mr-2 -mt-2 text-muted-foreground hover:text-foreground"
        aria-label="Close help"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Tips Section - existing */}
      {/* Feedback Section - existing */}
    </div>
  );
}
```

---

### Files to Modify
1. `src/pages/Help.tsx` - Add close button with back navigation
