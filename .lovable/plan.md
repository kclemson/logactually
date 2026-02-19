
## Turn off spellcheck on the medication notes textarea

Single change in `src/components/MedicationEntryInput.tsx` — add `spellCheck={false}` to the `<Textarea>` at line 188:

```tsx
<Textarea
  placeholder="Notes"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Escape') onCancel();
  }}
  spellCheck={false}
  className="min-h-[60px] text-sm resize-y"
/>
```

No other files need changing.
