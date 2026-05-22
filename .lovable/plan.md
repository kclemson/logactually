Plan:

1. Replace the current bloodwork result-row grid with a simpler, explicit three-column structure:

```text
[test name]        [value flag]      [reference range]
```

2. Treat `value + H/L flag` as one cell:
- value is left-aligned at the start of the value column
- flag sits immediately to the right of the value only when abnormal
- no unit is rendered or used in layout

3. Remove the fragile narrow `3.5rem` value track and use a stable value column wide enough for normal lab values plus an optional flag, so the reference range column does not influence value alignment.

4. Keep the markup intentionally boring:
- one row container
- one name cell
- one value cell
- one reference cell
- small helper logic only for `valueStr`, `refRange`, and normalized flag color

Technical notes:
- The `unit` field still exists in the database type, but this component is not rendering it. I’ll keep it completely out of the row math.
- The likely layout issue is the combination of CSS Grid tracks (`1fr 3.5rem auto`) plus a too-narrow value column, not hidden unit text.
- I’ll make the value column explicit and left-anchored so all values start from the same x-position regardless of digit count or reference range length.