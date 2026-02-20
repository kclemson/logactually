
## Three changes across three files

### 1. Edge function system prompt — `supabase/functions/ask-trends-ai/index.ts`

Replace the final sentence of the system prompt:

**Current:**
```
Do not give medical advice — suggest consulting a professional for medical questions. If the data is insufficient to answer, say so.
```

**Updated:**
```
You can make general wellness observations and data-driven suggestions from the user's logs. Do not diagnose conditions, make clinical deficiency claims, prescribe specific supplements or therapeutic diets, or claim to treat or prevent any health condition. If the question is clearly clinical in nature, briefly note that the user should consult a healthcare professional or registered dietitian. If the data is insufficient to answer, say so.
```

---

### 2. Live response disclaimer — `src/components/AskTrendsAIDialog.tsx`

Add a static disclaimer line between the response div and the action buttons:

```tsx
<p className="text-[10px] text-muted-foreground leading-snug">
  Not medical advice — consult a healthcare professional or registered dietitian for personal health guidance.
</p>
```

---

### 3. Pinned chat expanded view — `src/components/PinnedChatsView.tsx`

Add the same disclaimer below the expanded response div, inside the `isExpanded` block:

```tsx
<p className="text-[10px] text-muted-foreground mt-1 leading-snug">
  Not medical advice — consult a healthcare professional or registered dietitian for personal health guidance.
</p>
```

---

### Summary

| File | Change |
|---|---|
| `supabase/functions/ask-trends-ai/index.ts` | Broaden system prompt disclaimer to cover diagnosis/prescription, not nutritional observations |
| `src/components/AskTrendsAIDialog.tsx` | Add static "Not medical advice" disclaimer after the response div |
| `src/components/PinnedChatsView.tsx` | Add same disclaimer below expanded pinned chat response |
