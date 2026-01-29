

## Fix Placeholder Not Updating When Weight Unit Changes

### The Problem

The placeholder text is captured once when the `LogInput` component mounts using `useState`:

```typescript
const placeholders = getPlaceholders(mode, weightUnit);  // ✅ Updates when weightUnit changes

const [defaultPlaceholder] = useState(
  () => placeholders[Math.floor(Math.random() * placeholders.length)],  // ❌ Only runs on mount
);
```

When you change from lbs to kg in Settings, the component doesn't remount - it just receives a new `weightUnit` prop. But `useState` initializers only run once, so the old "lbs" placeholder persists.

---

### The Solution

Use `useMemo` instead of `useState` to derive the placeholder. This ensures it recalculates when `weightUnit` changes:

```typescript
// Memoize the random index so it's stable per session
// but the actual placeholder updates when unit changes
const randomIndex = useMemo(
  () => Math.floor(Math.random() * placeholders.length),
  [] // Stable random index per component instance
);

// Now derive the placeholder from the current placeholders array
const defaultPlaceholder = placeholders[randomIndex % placeholders.length];
```

This approach:
- Keeps the same random selection position (so "example 3" stays "example 3")
- But now pulls from the correct array (lbs vs kg) based on current settings
- Uses modulo to handle edge cases where arrays have different lengths

---

### File to Modify

| File | Change |
|------|--------|
| `src/components/LogInput.tsx` | Replace `useState` for `defaultPlaceholder` with `useMemo`-derived value |

---

### Code Change

**Before (lines 130-132):**
```typescript
const [defaultPlaceholder] = useState(
  () => placeholders[Math.floor(Math.random() * placeholders.length)],
);
```

**After:**
```typescript
// Stable random index per component instance
const [randomIndex] = useState(() => Math.floor(Math.random() * 100));
// Derive placeholder from current placeholders (updates when weightUnit changes)
const defaultPlaceholder = placeholders[randomIndex % placeholders.length];
```

