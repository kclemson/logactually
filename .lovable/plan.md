
## Improve Notification Dot Styling

### Problem
The current notification dot uses `bg-primary` which appears as a stark white circle in dark mode, making it look like an error or UI glitch rather than an intentional notification indicator.

### Solution
Change the dot to use the signature blue color (the same focus blue used elsewhere in the app) and add a subtle ring/border for better visual definition:

**Changes to `src/components/Header.tsx`:**

```tsx
{hasUnread && (
  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[hsl(217_91%_60%)] ring-2 ring-background" />
)}
```

- `bg-[hsl(217_91%_60%)]` - Uses the app's signature blue instead of primary (white in dark mode)
- `ring-2 ring-background` - Adds a small ring in background color around the dot, giving it a "punched out" look that appears more intentional and designed

This matches the blue used for interactive elements throughout the app (per the design system memory) and will look consistent in both light and dark themes.
