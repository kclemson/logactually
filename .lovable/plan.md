# Remove dropzone helper text

In `src/components/custom/MemoryComposer.tsx`, remove the line in the empty media dropzone that reads "optional — a note on its own is plenty":

```tsx
<span className="text-xs text-white/50">optional — a note on its own is plenty</span>
```

The dropzone keeps its teal `ImagePlus` chip and the "Add photos or video" label. No other changes.