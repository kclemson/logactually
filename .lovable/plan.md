

## Shrink calories and time-ago text in typeahead suggestions

The label, calories, and time-ago are all `text-xs` (12px). Shrink the right-side metadata (calories + time ago) to `text-[10px]` so the food name gets more room before truncating.

**`src/components/TypeaheadSuggestions.tsx`** line 90:

Change the right-side span from `text-xs` to `text-[10px]`:

```tsx
<span className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground">
```

The `labelDetail` portion size (line 87) also competes for space — shrink it too from `text-xs` to `text-[10px]`:

```tsx
<span className="ml-1 text-[10px] text-muted-foreground">({candidate.labelDetail})</span>
```

