### Normalize Bloodwork Flag Display + Re-Color Out-of-Range

**Goal:** Make bloodwork flag labels consistent and use a single amber color for any out-of-range result.

**Current state:**
- Flags render verbatim from the database: `H`, `High`, `L`, `Low`, `Alert`
- High flags are colored orange; low flags are colored blue

**Changes in `src/components/BloodworkPanelGroup.tsx`:**

1. **Add `normalizeFlag` helper** (module-level):
   ```ts
   function normalizeFlag(flag: string | null): 'High' | 'Low' | null {
     if (!flag) return null;
     const upper = flag.trim().toUpperCase();
     if (upper.startsWith('H')) return 'High';
     if (upper.startsWith('L')) return 'Low';
     return null;
   }
   ```
   This maps `H`, `High`, `HH` → `"High"` and `L`, `Low`, `LL` → `"Low"`. Anything else (including `Alert`) returns `null` and renders no flag label.

2. **Update 4 flag rendering sites** (identical logic appears twice in the filtering/rows-only view and twice in the expanded panel view):
   - Replace conditional orange/blue classes with a single amber class for any non-null normalized flag.
   - Render the normalized string (`"High"` / `"Low"`) instead of the raw `r.flag` value.
   - Keep `font-medium` on the numeric value when out of range.

**Visual result:**
- All out-of-range values (high or low) show in `amber-600` / `amber-400` with a `"High"` or `"Low"` label.
- In-range values remain unchanged (no flag, default text color).

**No database or API changes.**