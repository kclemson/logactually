

## Change Custom Log Dropdown Label

### What changes
A single edit to `src/pages/OtherLog.tsx` -- the Select trigger will show a static label instead of the selected log type's name.

### Details

**Current behavior**: The teal dropdown shows the name of the currently selected log type (e.g. "Log Body Weight"), making it look like a button rather than a dropdown.

**New behavior**: The trigger will always display **"Add custom log"** as a static label, making it clear it's a selector. The dropdown items will keep showing the specific type names (e.g. "Log Body Weight", "Log Sleep") so the user knows what they're picking.

### Technical change

In `src/pages/OtherLog.tsx`, replace the `<SelectValue>` inside the trigger with a static string, and remove the `value` prop from `<Select>` (or keep it for internal state but override the display). Specifically:

- Change the `SelectTrigger` contents from `<SelectValue placeholder="Log..." />` to a static `"Add custom log"` span
- This way the trigger always reads "Add custom log" regardless of which type is internally selected
- The dropdown items remain unchanged so the user sees all their log types listed
