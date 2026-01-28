

## Add Resizable Columns to DevToolsPanel Results Table

### Goal

Allow developers to drag column borders to resize column widths in the test results table, making it easier to view long Input and Source Note content.

### Approach

Implement a lightweight, custom resizable columns solution using React state and mouse events. This avoids adding new dependencies and keeps the DevToolsPanel self-contained.

### Changes

| File | Change |
|------|--------|
| `src/components/DevToolsPanel.tsx` | Add column resize handles and state management |

### Implementation Details

**1. Add column width state**

Track each column's width in state, with sensible defaults:

```tsx
const [columnWidths, setColumnWidths] = useState({
  input: 200,
  source: 60,
  prompt: 80,
  output: 250,
  sourceNote: 200,
});
```

**2. Add resize handle component**

Create a draggable resize handle that appears at the right edge of each header cell:

```tsx
const ResizeHandle = ({ columnKey }: { columnKey: string }) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + delta);
      setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
    />
  );
};
```

**3. Update table headers**

Wrap each header cell in a relative container and add the resize handle:

```tsx
<th className="relative px-1 py-1" style={{ width: columnWidths.input }}>
  <span className="font-medium text-xs">Input</span>
  <ResizeHandle columnKey="input" />
</th>
```

**4. Apply widths to data cells**

Use inline styles on `<td>` elements to match header widths:

```tsx
<td style={{ width: columnWidths.input, maxWidth: columnWidths.input }}>
  ...
</td>
```

**5. Table layout**

Set `table-layout: fixed` on the table to ensure column widths are respected:

```tsx
<table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
```

### Visual Behavior

- Drag handles appear as a thin vertical line on the right edge of each column header
- Handles highlight on hover (subtle blue/primary color)
- Cursor changes to `col-resize` when hovering over handles
- Minimum column width of 50px prevents columns from becoming too narrow
- Widths persist during the session (could optionally add localStorage persistence later)

### Technical Notes

- Uses `table-layout: fixed` for predictable column sizing
- No external dependencies required
- Uses document-level mouse events for smooth dragging even when cursor leaves the handle
- Cleanup handlers prevent memory leaks

