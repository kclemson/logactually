

## Add Source Note Column to DevToolsPanel

### Goal

Display the AI's `source_note` field (the data source/estimation explanation) as a visible column in the test results table, making it easier to review without hovering.

### Current State

- The `source_note` is already retrieved from the database and available in the `FoodItemOutput` interface
- It's currently only visible as a tooltip when hovering over a food item row
- The confidence level is shown as a colored dot (green/yellow/red)

### Changes

| File | Change |
|------|--------|
| `src/components/DevToolsPanel.tsx` | Add a new "Source Note" column after the Output column |

### Implementation Details

**1. Add column header (line 340)**

Add a new `<th>` for "Source Note" after the "Output" header.

**2. Add column data (after line 396)**

For each result row, add a new `<td>` that displays the `source_note` values from each food item. Since a result can have multiple food items, we'll show them stacked (like the output column does).

The column will:
- Show each item's `source_note` on its own line
- Use muted styling since it's supplementary info
- Truncate long notes with a title attribute for full text on hover
- Show "—" if no source note is provided

### Code Structure

```text
Table columns (current):
[Input] [Source] [Prompt] [Output]

Table columns (new):
[Input] [Source] [Prompt] [Output] [Source Note]
```

### Visual Result

The new column will display text like:
- "Based on standard Activia vanilla single-serve cup."
- "A 'handful' is typically estimated as 1 ounce..."
- "—" (when no note provided)

This makes it easy to quickly scan the AI's reasoning without needing to hover over each row.

