

## Increase Prompt Eval Panel Max Width to 1200px

### Change Required

**File: `src/components/DevToolsPanel.tsx`**

Update line 280 to use a custom max-width of 1200px instead of `max-w-5xl` (1024px):

```tsx
// Before:
<div className="mx-auto max-w-5xl px-6">

// After:
<div className="mx-auto max-w-[1200px] px-6">
```

Since Tailwind's preset sizes jump from `max-w-5xl` (1024px) to `max-w-6xl` (1152px) to `max-w-7xl` (1280px), using the arbitrary value `max-w-[1200px]` gives the exact width requested.

