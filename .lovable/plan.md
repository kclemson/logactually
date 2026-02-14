

## Style Unit in Custom Log Type Row

### What changes
A single edit to `src/components/CustomLogTypeRow.tsx` to separate the unit from the name text and render it in a smaller, gray font.

### Details

**Current**: The name and unit are rendered together as one string inside the contentEditable div: `Body Weight (lbs)`

**New**: The unit will be rendered as a separate `span` outside the contentEditable div, styled with `text-xs text-muted-foreground` so it appears smaller and gray. The contentEditable div will only contain the name itself, which also fixes a potential issue where editing the name could accidentally include the unit text.

### Technical change

In `src/components/CustomLogTypeRow.tsx`:
- Remove `{type.unit ? ` (${type.unit})` : ''}` from inside the contentEditable div (line 90)
- Add a separate span right after the contentEditable div: `{type.unit && <span className="text-xs text-muted-foreground shrink-0">({type.unit})</span>}`

