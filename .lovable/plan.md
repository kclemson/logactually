

## Update Exercise and Custom Logging Toggle Labels

### What changes

Two small text edits in `src/pages/Settings.tsx`:

1. **Line 221**: Capitalize "Custom" -- change `"Enable custom logging"` to `"Enable Custom logging"`
2. **Lines 244-245**: Restructure the Exercise toggle to match the Custom logging toggle format:
   - Change label from `"Enable Exercise"` to `"Enable Exercise logging"`
   - Add a subtitle underneath: `"Use the Exercise tab to log lifting, cardio, and more"`
   - Wrap in a `<div>` container (like the custom logging toggle already does)

### Technical details

**Line 221** -- simple text change:
```
"Enable custom logging"  -->  "Enable Custom logging"
```

**Lines 244-245** -- restructure from a bare `<p>` to a wrapper `<div>` with subtitle:
```tsx
// Before
<p className="text-xs text-muted-foreground">Enable Exercise</p>

// After
<div>
  <p className="text-xs text-muted-foreground">Enable Exercise logging</p>
  <p className="text-[10px] text-muted-foreground/70">Use the Exercise tab to log lifting, cardio, and more</p>
</div>
```

