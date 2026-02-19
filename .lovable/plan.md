
## Show medication dose/frequency meta in the custom log section headers

### What the user wants

In `CustomLogEntriesView.tsx`, each group renders a small header with just the medication name (e.g. "Decadron Eye Drops"). The user wants the same `"2 drops · as needed"` or `"5 mg · 2x/day"` string that already appears in the settings list — appended after the name, separated by a `·`.

### Where the string is built today

In `src/components/CustomLogTypeRow.tsx` (settings list), the meta string is computed inline:

```ts
const meta = type.value_type === 'medication' ? (() => {
  const dosePart = type.default_dose != null && type.unit
    ? `${type.default_dose} ${type.unit}`
    : type.unit || null;
  const freqPart = type.doses_per_day > 0 ? `${type.doses_per_day}x/day` : 'as needed';
  return dosePart ? `${dosePart} · ${freqPart}` : freqPart;
})() : undefined;
```

This logic needs to move to a shared utility so both components use the same string without duplication.

### Plan

**Step 1 — Extract the helper into `src/lib/medication-meta.ts`**

Create a small utility that accepts the relevant fields and returns the formatted string (or `null` for non-medications):

```ts
export function getMedicationMeta(logType: {
  value_type: string;
  default_dose: number | null;
  unit: string | null;
  doses_per_day: number;
}): string | null {
  if (logType.value_type !== 'medication') return null;
  const dosePart = logType.default_dose != null && logType.unit
    ? `${logType.default_dose} ${logType.unit}`
    : logType.unit || null;
  const freqPart = logType.doses_per_day > 0
    ? `${logType.doses_per_day}x/day`
    : 'as needed';
  return dosePart ? `${dosePart} · ${freqPart}` : freqPart;
}
```

**Step 2 — Update the section header in `CustomLogEntriesView.tsx`**

At lines 281–285, after the medication name, render the meta string in the same muted style used in settings:

```tsx
<div className="py-0.5 flex items-baseline gap-1.5">
  <span className="text-xs font-medium text-muted-foreground">
    {logType?.name ?? 'Unknown'}
  </span>
  {isMedication && logType && (() => {
    const meta = getMedicationMeta(logType);
    return meta ? (
      <span className="text-xs text-muted-foreground/60">· {meta}</span>
    ) : null;
  })()}
</div>
```

The `·` separator and slightly more muted color (`text-muted-foreground/60`) give the meta a secondary, subordinate feel — it's informational context, not the primary label.

**Step 3 — Refactor `CustomLogTypeRow.tsx` to use the shared helper**

Replace the inline IIFE with a call to `getMedicationMeta(type)`, keeping the settings list behavior identical.

### Files to change

| File | Change |
|---|---|
| `src/lib/medication-meta.ts` | **New file** — `getMedicationMeta` utility |
| `src/components/CustomLogEntriesView.tsx` | Import helper, add meta after name in medication group headers |
| `src/components/CustomLogTypeRow.tsx` | Import helper, replace inline IIFE |

No schema, hook, or page changes needed.
