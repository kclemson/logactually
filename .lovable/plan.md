

## Position Unit Next to Name and Hide During Editing

### What changes
Two adjustments in `src/components/CustomLogTypeRow.tsx`:

1. **Unit sits right after the name** -- Wrap the contentEditable name div and unit span in a shared inline container so the unit appears immediately after the name text (not right-justified).

2. **Unit hides while editing** -- Track focus state with a `isEditing` boolean (via `onFocus`/`onBlur`). When editing, hide the unit span so the editable field stretches cleanly across its full width.

### Technical details

- Add `const [isEditing, setIsEditing] = useState(false)` state.
- In the existing `onFocus` handler, also call `setIsEditing(true)`.
- In the existing `onBlur` handler, also call `setIsEditing(false)`.
- Wrap the contentEditable div and unit span in a `<div className="flex items-center gap-1 flex-1 min-w-0">`.
- Move `flex-1` from the contentEditable div to this wrapper. The contentEditable div keeps its styling but without `flex-1` when not editing; add `flex-1` conditionally when `isEditing` so it expands to fill the space.
- Conditionally render the unit: `{type.unit && !isEditing && <span ...>({type.unit})</span>}`.

