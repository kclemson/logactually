### Extend Bloodwork Filter to Match Sections and Flags

**Goal:** Let users filter bloodwork results by panel section name (e.g. "Lipid") and by out-of-range status (e.g. "High", "Low").

**Change in `src/components/BloodworkPanelGroup.tsx` → `resultMatchesQuery`:**

Extend the match to additionally check:
1. **`r.panel_section`** — substring match (so "lipid" matches all results under the "Lipid Panel" section).
2. **Normalized flag** — run `normalizeFlag(r.flag)` and substring-match against `"high"` / `"low"`. So typing `high` shows only flagged-high results, `low` shows only flagged-low. Partial typing like `hi` will also match `"High"` (acceptable — same substring semantics as the rest).

```ts
export function resultMatchesQuery(r, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  const nf = normalizeFlag(r.flag);
  return (
    (r.display_name?.toLowerCase().includes(needle) ?? false) ||
    (r.analyte_name?.toLowerCase().includes(needle) ?? false) ||
    (r.panel_section?.toLowerCase().includes(needle) ?? false) ||
    (nf?.toLowerCase().includes(needle) ?? false)
  );
}
```

**No other changes.** The existing rows-only filtered view already collapses section chrome, so section-name matches surface as a flat list of that section's results under the date label — which is the desired compact behavior.

**No DB or API changes.**