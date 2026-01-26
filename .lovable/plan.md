
Goal  
Fix the “portion floats on the first line while the name wraps to the second line” issue on the main Food Log page (route “/”), and ensure there’s always a readable space before the opening parenthesis.

What’s happening (root cause)  
- On “/”, `FoodItemsTable` runs in `editable={true}` mode.
- In editable mode, the description and portion are currently laid out as separate flex children inside a `flex items-baseline` container.
- When the description wraps to two lines, baseline alignment uses the first line’s baseline, so the portion stays visually attached to the first line (e.g., “Ground (0.5 tsp)” + “Cinnamon”), which looks wrong.

What we’ll change  
1) Update the editable description cell layout to be inline text flow (not flex siblings)
- In `src/components/FoodItemsTable.tsx`, inside the `{editable ? (...) : (...)}` block:
  - Keep the outer wrapper that reserves chevron space.
  - Replace the inner container currently using:
    - `flex items-baseline` between the contentEditable element, portion, and asterisk
  - With a non-flex container where:
    - the description is an inline contentEditable element
    - the portion is an inline `<span>` immediately after the description
    - the edited “*” indicator is also inline after that
  Result: when the name wraps to 2 lines, the portion will naturally appear after the last word (typically on line 2: “Cinnamon (0.5 tsp)”).

2) Ensure proper spacing before “(”
- In editable mode, change the portion rendering from:
  - `({item.portion})` with margin hacks
- To:
  - ` ({item.portion})` (a literal leading space in the text), matching the non-editable mode behavior.

3) Adjust event handler typings after changing contentEditable element
- If we switch the editable element from `<div contentEditable>` to `<span contentEditable>` (recommended for inline flow):
  - Update the handler signatures:
    - `handleDescriptionKeyDown` from `React.KeyboardEvent<HTMLDivElement>` to `React.KeyboardEvent<HTMLSpanElement>` (or `HTMLElement` if we want to be flexible)
    - `handleDescriptionFocus/Blur` similarly
  - Update the `ref` typing usage accordingly (still safe since we only use `textContent` and `document.activeElement` checks).

4) Keep the existing “edits only save on Enter” behavior intact
- Confirm:
  - Enter saves description and clears `portion` (already implemented)
  - Escape cancels and reverts
  - Blur cancels and reverts
- Ensure that the new inline layout doesn’t accidentally insert line breaks on Enter (we already `preventDefault()`; we’ll keep that).

5) Quick visual verification checklist
- On “/” (editable mode):
  - A 2-line name like “Ground Cinnamon” should display as:
    - Line 1: “Ground”
    - Line 2: “Cinnamon (0.5 tsp)” (or “Cinnamon” then portion if there’s room)
  - Confirm there’s a visible space before “(”
  - Confirm the focus ring/blue editing style still works
- On “/history” (non-editable mode):
  - No regression; it already uses inline flow.

Files involved  
- `src/components/FoodItemsTable.tsx`
  - Editable description cell layout refactor (main fix)
  - Portion spacing tweak
  - Handler typings updates (if needed)

Expected outcome  
- Portions will no longer “stick” to the first line when descriptions wrap.
- The portion will read naturally as part of the description line flow, with correct spacing.
- Editing UX and “save on Enter” persistence model remains unchanged.
