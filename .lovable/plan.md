

## Remove Admin Gate from Ask AI Feature

**File: `src/pages/Trends.tsx`**

Two lines to change -- remove the `isAdmin ?` conditional wrapping the "Ask AI" buttons so they show for all users:

### Line 711 (Food Trends header action)

Replace:
```tsx
headerAction={isAdmin ? <button onClick={() => setFoodAIOpen(true)} className="text-xs text-primary hover:underline flex items-center gap-1">Ask AI</button> : undefined}
```
With:
```tsx
headerAction={<button onClick={() => setFoodAIOpen(true)} className="text-xs text-primary hover:underline flex items-center gap-1">Ask AI</button>}
```

### Line 787 (Exercise Trends header action)

Same change -- remove the `isAdmin ?` ternary so the button always renders.

Two edits, same file. No backend changes needed since the edge function already authenticates any logged-in user.

