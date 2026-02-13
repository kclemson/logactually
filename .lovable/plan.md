

## Prevent duplicate suggestion chips on refresh

**Problem**: The `pickRandom` function uses a simple shuffle, so clicking refresh can show chips you've already seen.

**Fix** in `src/components/AskTrendsAIDialog.tsx`:

- Track previously shown chip indices (or values) in a `Set` via `useRef`
- On each refresh, filter the pool to exclude already-seen chips before picking
- When the pool runs out of unseen chips, reset the seen set and start fresh

### Technical detail

Replace the current `pickRandom` + `refreshChips` logic in `AskTrendsAIDialogInner`:

```tsx
const seen = useRef<Set<string>>(new Set());

const pickFresh = useCallback(() => {
  let available = pool.filter(p => !seen.current.has(p));
  if (available.length < 4) {
    seen.current.clear();
    available = pool;
  }
  const picked = pickRandom(available, 4);
  picked.forEach(p => seen.current.add(p));
  return picked;
}, [pool]);

const [chips, setChips] = useState(() => {
  const picked = pickRandom(pool, 4);
  picked.forEach(p => seen.current.add(p));
  return picked;
});

const refreshChips = () => setChips(pickFresh());
```

No other files need changes.

