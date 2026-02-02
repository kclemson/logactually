

## Demo Mode Preview - Reusing Existing Table Components

Show demo users what would be logged by reusing the existing `FoodItemsTable` and `WeightItemsTable` components in read-only mode.

---

### Confirmed: Tables Are Already Factored for This

Both table components support all needed features:

| Prop | Purpose | Already Supported |
|------|---------|-------------------|
| `editable={false}` | Read-only display, no edit controls | Yes |
| `entryBoundaries` | Groups items under a single entry | Yes |
| `entryRawInputs` | Maps entry ID to original text | Yes |
| `expandedEntryIds` | Tracks which entries are expanded | Yes |
| `onToggleEntryExpand` | Callback to toggle expansion | Yes |
| `showTotals` | Display totals row | Yes |

No changes needed to the table components themselves.

---

### New Component: `DemoPreviewDialog`

A thin wrapper that:
1. Creates a synthetic entry structure for the preview items
2. Manages local expansion state
3. Renders the appropriate table with `editable={false}`

```tsx
// Core structure
const previewEntryId = 'demo-preview';

// Entry boundaries: single entry spanning all items
const entryBoundaries = [{
  entryId: previewEntryId,
  startIndex: 0,
  endIndex: items.length - 1
}];

// Raw input map
const entryRawInputs = rawInput 
  ? new Map([[previewEntryId, rawInput]]) 
  : new Map();

// Local expansion state
const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());
const handleToggleExpand = (entryId: string) => {
  setExpandedEntryIds(prev => {
    const next = new Set(prev);
    next.has(entryId) ? next.delete(entryId) : next.add(entryId);
    return next;
  });
};
```

Then pass to table:
```tsx
<FoodItemsTable
  items={itemsWithEntryId}
  editable={false}
  showHeader={true}
  showTotals={true}
  totalsPosition="bottom"
  entryBoundaries={entryBoundaries}
  entryRawInputs={entryRawInputs}
  expandedEntryIds={expandedEntryIds}
  onToggleEntryExpand={handleToggleExpand}
/>
```

---

### Implementation

**New file: `src/components/DemoPreviewDialog.tsx`**

Props:
- `mode: 'food' | 'weights'`
- `open: boolean`
- `onOpenChange: (open: boolean) => void`
- `foodItems?: FoodItem[]`
- `weightSets?: WeightSet[]`
- `weightUnit?: WeightUnit`
- `rawInput: string | null`

Dialog content:
- Title: "Here's what would be logged:"
- Table component with expansion support
- Footer: "Got it" (outline) | "Create Free Account" (primary)

"Create Free Account" action:
- Signs out the demo user
- Navigates to /auth

---

### Changes to Page Components

**`src/pages/FoodLog.tsx`**

Add state:
```tsx
const [demoPreviewOpen, setDemoPreviewOpen] = useState(false);
const [demoPreviewItems, setDemoPreviewItems] = useState<FoodItem[]>([]);
const [demoPreviewRawInput, setDemoPreviewRawInput] = useState<string | null>(null);
```

Update handlers to intercept after getting items:
- `handleSubmit` - after `analyzeFood()` returns
- `handleScanResult` - item already available
- `handleLogSavedMeal` - items already available

**`src/pages/WeightLog.tsx`**

Same pattern:
- `handleSubmit` - after `analyzeWeights()` returns
- `handleLogSavedRoutine` - items already available

**`src/components/LogInput.tsx`**

Remove the early `isReadOnly` block in `handleSubmit` that currently prevents the submit from reaching the parent. Let the parent components handle the interception after getting data.

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/DemoPreviewDialog.tsx` | **New** - Wrapper dialog using existing tables |
| `src/pages/FoodLog.tsx` | Add preview state, intercept 3 handlers |
| `src/pages/WeightLog.tsx` | Add preview state, intercept 2 handlers |
| `src/components/LogInput.tsx` | Remove early isReadOnly block |

---

### Dialog Layout

```text
┌─────────────────────────────────────────────────────┐
│ Here's what would be logged:                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Existing FoodItemsTable or WeightItemsTable       │
│   with editable={false}, showing chevron for        │
│   expansion, totals at bottom]                      │
│                                                     │
├─────────────────────────────────────────────────────┤
│      [Got it]              [Create Free Account]    │
└─────────────────────────────────────────────────────┘
```

---

### Risk Assessment

**Low risk** because:
- Tables already support all needed props
- No changes to table internals
- Just wiring up existing components in a new context
- Read-only mode is battle-tested in Settings page saved items

