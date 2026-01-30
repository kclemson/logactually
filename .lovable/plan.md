

## Fix: Stabilize Exercise Chart Click Handler with useCallback

### The Problem
The `ExerciseChart` components receive inline arrow functions `(date) => navigate(...)` which creates a new function on every render. Recharts may cache or bind click handlers based on prop identity, causing unreliable first-click behavior.

### The Solution
Use `useCallback` to create a stable function reference that doesn't change between renders.

### Changes

**File: `src/pages/Trends.tsx`**

1. **Line 1** - Add `useCallback` to imports:
   ```tsx
   import { useState, useMemo, useCallback } from "react";
   ```

2. **Around line 239** - Add stable callback after existing hooks:
   ```tsx
   const handleExerciseBarClick = useCallback((date: string) => {
     navigate(`/weights?date=${date}`);
   }, [navigate]);
   ```

3. **Line 688** - Use stable callback:
   ```tsx
   onBarClick={handleExerciseBarClick}
   ```
   (instead of `onBarClick={(date) => navigate(...)}`)

4. **Line 726** - Use stable callback:
   ```tsx
   onBarClick={handleExerciseBarClick}
   ```
   (instead of `onBarClick={(date) => navigate(...)}`)

### Summary
- 4 small edits
- No behavioral changes
- Click handler now fires reliably on first click

