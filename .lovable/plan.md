
## Persist Trends Period Selection with localStorage

A minimal change to remember the user's period selection across page refreshes.

---

### Implementation

**File:** `src/pages/Trends.tsx`

**1. Update useState initializer to read from localStorage (line 157)**

```tsx
// Before
const [selectedPeriod, setSelectedPeriod] = useState(30);

// After
const [selectedPeriod, setSelectedPeriod] = useState(() => {
  const saved = localStorage.getItem('trends-period');
  return saved && [7, 30, 90].includes(Number(saved)) ? Number(saved) : 30;
});
```

**2. Add localStorage write in button click handler (line 260)**

```tsx
// Before
onClick={() => setSelectedPeriod(days)}

// After
onClick={() => {
  localStorage.setItem('trends-period', String(days));
  setSelectedPeriod(days);
}}
```

---

### How It Works

- **First visit**: No localStorage entry → defaults to 30 days
- **User changes period**: Saves choice to localStorage + updates state
- **Page refresh**: Reads saved value from localStorage on mount
- **Invalid value**: Falls back to 30 days (validates against allowed values)

---

### Files to Modify

- `src/pages/Trends.tsx` (2 small edits)
