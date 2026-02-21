

# Inline-Editable Chart Title and AI Note

## Problem
The current implementation adds separate Input fields that duplicate the title and note already rendered inside the chart preview. Users see each value twice.

## Solution
Remove the separate Input fields and instead make the title and aiNote inside the chart itself editable when the dialog is in edit/create mode. This is done by passing optional `onTitleChange` and `onAiNoteChange` callbacks into `DynamicChart`, which forwards them to `ChartCard`. When these callbacks are present, the title and note render as `contentEditable` spans instead of plain text.

## Changes

### 1. Remove the duplicate Input fields from `CustomChartDialog.tsx`
- Delete the two `<Input>` elements (title above chart, note below chart) that were just added
- Keep the `Input` import removal if no longer needed

### 2. Add edit callbacks to `DynamicChart`
- Add optional props: `onTitleChange?: (title: string) => void` and `onAiNoteChange?: (note: string) => void`
- When `onAiNoteChange` is provided, make the footer note a `contentEditable` element instead of plain text
- Pass `onTitleChange` through to `ChartCard`

### 3. Update `ChartCard` to support inline title editing
- Add optional `onTitleChange?: (title: string) => void` prop
- When present, render the `ChartTitle` content inside a `contentEditable` span with `onBlur` to commit the change
- Style the editable state with a subtle underline or outline so users know it's clickable

### 4. Wire it up in `CustomChartDialog.tsx`
- Pass `onTitleChange` and `onAiNoteChange` to the `DynamicChart` in the result section
- These callbacks update `currentSpec` state as before: `setCurrentSpec(prev => ({ ...prev!, title: newTitle }))`

## Technical details

**ChartCard changes:**
- `onTitleChange` prop added to interface
- When set, `ChartTitle` children wrapped in a `contentEditable` span:
  ```tsx
  <ChartTitle>
    {onTitleChange ? (
      <span
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onTitleChange(e.currentTarget.textContent ?? "")}
        className="outline-none border-b border-dashed border-muted-foreground/30 focus:border-primary"
      >
        {title}
      </span>
    ) : title}
  </ChartTitle>
  ```

**DynamicChart footer changes:**
- When `onAiNoteChange` is provided, the footer renders a `contentEditable` paragraph with the same pattern
- When not provided (normal Trends page view), behavior is unchanged

**CustomChartDialog changes:**
- Remove the two `<Input>` elements
- Add callbacks to the existing `<DynamicChart>`:
  ```tsx
  <DynamicChart
    spec={currentSpec}
    period={period}
    onTitleChange={(t) => setCurrentSpec(prev => ({ ...prev!, title: t }))}
    onAiNoteChange={(n) => setCurrentSpec(prev => ({ ...prev!, aiNote: n }))}
  />
  ```

This approach reuses the existing `contentEditable` pattern already established in the codebase (via `DescriptionCell`) and avoids any field duplication.

