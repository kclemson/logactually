

## Prevent "Last" column text wrapping on mobile

**Problem**: The "Last" column in the admin user stats table wraps dates like "Feb 13" onto two lines on mobile.

**Fix**: Add `whitespace-nowrap` to the "Last" `<td>` cell (line 166) so the date stays on one line.

### Technical Details

**File: `src/pages/Admin.tsx`** (line ~166)

Change the "Last" `<td>` className to include `whitespace-nowrap`:

```typescript
// Before
<td className={`text-center py-0.5 pr-2 ${...}`}>

// After  
<td className={`text-center py-0.5 pr-2 whitespace-nowrap ${...}`}>
```

This is a single-line change. The header already fits, and the date values ("Feb 13", "Jan 30", etc.) will stay on one line.

