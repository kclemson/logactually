

## Use a generic `labelDetail` field instead of `portion`

The `TypeaheadCandidate` interface is domain-agnostic. Instead of adding `portion`, add a generic optional field that any domain can use for secondary inline text.

### Changes

**`src/hooks/useTypeaheadSuggestions.ts`** — add to `TypeaheadCandidate` interface:
```typescript
/** Optional detail rendered inline after the label in smaller text (e.g. portion size) */
labelDetail?: string;
```

**`src/components/TypeaheadSuggestions.tsx`** (~line 84) — render it:
```tsx
<span className="truncate">
  <span className="font-medium">{candidate.label}</span>
  {candidate.labelDetail && (
    <span className="ml-1 text-xs text-muted-foreground">({candidate.labelDetail})</span>
  )}
</span>
```

**`src/pages/FoodLog.tsx`** (~line 162) — populate it from the food-specific `portion` field when building candidates:
```typescript
labelDetail: item.portion || undefined,
```

This keeps TypeaheadSuggestions generic — it just renders an optional detail string. The food layer decides what goes in it.

