

## Tighter Row Spacing and Remove Horizontal Lines from Group Headers

### Changes

**1. Reduce vertical spacing between rows within a group (`CustomLogEntryRow.tsx`)**

Change `py-2` to `py-0.5` on both the standard grid row (line 157) and the multiline grid row (line 134). This tightens the spacing between entries like "waist" and "arm" under the same type.

**2. Remove horizontal lines from group headers (`OtherLog.tsx`)**

Replace the current divider header (lines 267-272) that has horizontal lines on both sides with just a centered label -- no lines. The label text stays as `text-xs font-medium text-muted-foreground`.

Current:
```
<div className="flex items-center gap-3 py-1">
  <div className="flex-1 h-px bg-border" />
  <span ...>{name}</span>
  <div className="flex-1 h-px bg-border" />
</div>
```

New:
```
<div className="text-center py-1">
  <span className="text-xs font-medium text-muted-foreground">{name}</span>
</div>
```

### Technical detail

**File: `src/components/CustomLogEntryRow.tsx`**
- Line 134: change `py-2` to `py-0.5` (multiline grid)
- Line 157: change `py-2` to `py-0.5` (standard grid)

**File: `src/pages/OtherLog.tsx`**
- Lines 267-272: replace the flex divider with a simple centered text element (no horizontal lines)
