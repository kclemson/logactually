

## Always Show "Resolved" Next to the Date

### File: `src/components/FeedbackForm.tsx`

1. **Line ~125**: Remove the `!item.response` condition so the resolved badge always appears next to the date:
   ```tsx
   {item.resolved_at && (
     <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Resolved</span>
   )}
   ```

2. **Line ~192** (inside the response block): Remove the duplicate resolved badge that currently shows below the response timestamp. This eliminates the redundancy since it will always be shown next to the date now.

