

## Left-Align Prompt Suggestion Pill Text

### File: `src/components/AskTrendsAIDialog.tsx`

Add `text-left` to the chip button className (line ~107) so multi-line pill text aligns left instead of center.

Current:
```tsx
className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors"
```

Updated:
```tsx
className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors text-left"
```

