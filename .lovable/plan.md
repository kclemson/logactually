

## Add Demo Data Population Button to Admin Page

### Overview

Add a button to the Admin page that triggers the `populate-demo-data` edge function with sensible defaults. Include loading state feedback and success/error messaging.

---

### UI Design

Add a small "Admin Actions" section at the bottom of the Admin page with:
- A "Populate Demo Data" button
- Loading spinner while running
- Success message showing summary (entries created)
- Error message if something fails

---

### Implementation

**1. Add state for button interaction**

```tsx
const [isPopulating, setIsPopulating] = useState(false);
const [populateResult, setPopulateResult] = useState<{
  success: boolean;
  message: string;
} | null>(null);
```

**2. Create handler function**

```tsx
const handlePopulateDemoData = async () => {
  setIsPopulating(true);
  setPopulateResult(null);
  
  try {
    const { data, error } = await supabase.functions.invoke('populate-demo-data', {
      body: {
        clearExisting: true,  // Fresh start each time
      }
    });
    
    if (error) throw error;
    
    setPopulateResult({
      success: true,
      message: `Created ${data.summary.foodEntries} food entries, ${data.summary.weightSets} weight sets, ${data.summary.savedMeals} saved meals, ${data.summary.savedRoutines} saved routines`
    });
  } catch (err) {
    setPopulateResult({
      success: false,
      message: err instanceof Error ? err.message : 'Failed to populate demo data'
    });
  } finally {
    setIsPopulating(false);
  }
};
```

**3. Add UI section**

```tsx
{/* Admin Actions */}
<div className="space-y-2 pt-4 border-t">
  <p className="font-medium text-xs text-muted-foreground">Admin Actions</p>
  <div className="flex items-center gap-2">
    <Button
      size="sm"
      variant="outline"
      onClick={handlePopulateDemoData}
      disabled={isPopulating}
      className="text-xs"
    >
      {isPopulating ? (
        <>
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
          Populating...
        </>
      ) : (
        'Populate Demo Data'
      )}
    </Button>
  </div>
  {populateResult && (
    <p className={`text-xs ${populateResult.success ? 'text-green-500' : 'text-destructive'}`}>
      {populateResult.message}
    </p>
  )}
</div>
```

---

### Required Imports

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
```

---

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Add imports, state, handler, and UI section for demo data population button |

