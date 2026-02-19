
## Rename view-mode selector labels and widen the trigger

### Labels

"Show All" vs "Medication Only" — the cleaner pair. "Show Medication Only" adds a word without adding clarity; the contrast with "Show All" already implies it's filtered.

### Changes — one file, two things

**`src/pages/OtherLog.tsx`**

1. Line 202 — widen the trigger from `w-[90px]` to `w-[140px]` to comfortably fit "Medication Only" at `text-sm` (which renders at ~110–115px):
```tsx
<SelectTrigger className="h-8 text-sm px-2 w-[140px] shrink-0">
```

2. Lines 206 and 208 — update the label strings:
```tsx
<SelectItem value="date" ...>Show All</SelectItem>
<SelectItem value="medication" ...>Medication Only</SelectItem>
```

No other files need changing — the `ViewMode` type values (`'date'` | `'medication'`) and localStorage key stay the same; only the display strings change.
