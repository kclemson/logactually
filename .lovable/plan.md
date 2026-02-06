

## Add Touch Support for Admin Tooltips

### Current State
- Radix tooltips already in use for desktop (hover)
- `hasHover` check completely hides tooltips on touch devices
- Touch users cannot access the detailed information at all

### Solution
Use Radix Tooltip's **controlled mode** on touch devices to enable tap-to-toggle:

```typescript
// Desktop: uncontrolled (hover)
<Tooltip>...</Tooltip>

// Touch: controlled (tap)
<Tooltip open={isOpen} onOpenChange={setIsOpen}>
  <TooltipTrigger onClick={() => setIsOpen(!isOpen)}>
```

### Implementation

**1. Add state to track active tooltip**
```typescript
const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
```

**2. Create helper component or inline pattern**
For each tooltipped cell, instead of:
```typescript
{hasHover && data ? (
  <Tooltip>...</Tooltip>
) : (
  <td>...</td>
)}
```

Do:
```typescript
<Tooltip 
  open={hasHover ? undefined : activeTooltip === cellId}
  onOpenChange={hasHover ? undefined : (open) => setActiveTooltip(open ? cellId : null)}
>
  <TooltipTrigger asChild>
    <td 
      onClick={!hasHover && data ? () => setActiveTooltip(activeTooltip === cellId ? null : cellId) : undefined}
    >
      ...
    </td>
  </TooltipTrigger>
  {data && <TooltipContent>...</TooltipContent>}
</Tooltip>
```

**3. Dismiss on outside tap**
Add a backdrop when tooltip is open on touch:
```typescript
{!hasHover && activeTooltip && (
  <div className="fixed inset-0 z-40" onClick={() => setActiveTooltip(null)} />
)}
```

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Add `activeTooltip` state, update tooltip cells to use controlled mode on touch, add dismiss backdrop |

### User Experience
- **Desktop**: Unchanged - hover shows tooltip
- **Touch**: Tap cell to show tooltip, tap elsewhere to dismiss
- Only one tooltip visible at a time on touch

