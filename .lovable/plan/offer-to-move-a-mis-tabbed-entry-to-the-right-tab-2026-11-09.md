# Offer to move a mis-tabbed entry to the right tab

## How it works today
When exercise text is submitted on the Food tab, the app already notices that no food came back. It shows a red message, "No food items detected. If this is exercise, try the Weights page." The Exercise tab works the same way in reverse. The text stays in the box, but you have to copy it, switch tabs, and submit again yourself.

## New behavior
The red message becomes a question with two short buttons, shown in the same spot:

```text
No food found. Log it as exercise instead?   [Yes] [No]
```

- The buttons are just **Yes** and **No**: the question already says "as exercise", and short buttons fit on a phone. The question goes on the left and the buttons on the right. On a narrow phone, the question can wrap onto a second line, but the buttons always stay together on one line.
- The box uses normal, readable text in place of today's dim red (hard to read in dark mode in your screenshot), because it's now a question, not an error.
- **Yes:** switches to the Exercise tab on the **same day** and submits the text there automatically. The new entry appears as if you'd typed it on that tab, and the Food box empties.
- **No:** closes the question and leaves your text in the Food box so you can fix it.
- The Exercise tab mirrors this ("Log it as food instead?").
- If exercise tracking is turned off in Settings, the Food tab keeps showing the current plain message, with no offer to move to a hidden tab.
- If the other tab can't make sense of the text either, its normal message appears there, with no second offer, so it can't bounce back and forth.
- Demo accounts get the same flow and end up at the usual preview on the other tab.

## Technical notes
- `useAnalyzeFood` / `useAnalyzeWeights`: keep the existing "nothing detected" detection, but report it as a flag (e.g. `noMatch: true`) alongside the warning, so the page can show the question instead of plain text.
- `FoodLog` / `WeightLog`: render an inline prompt with two buttons (no toast, no dialog). "Yes" clears this box's draft and calls `navigate('/weights?date=…' or '/?date=…', { state: { handoffText, fromOtherTab: true } })`.
- The receiving page reads the handoff text from the navigation state once on arrival, then replaces the history entry without that state so a refresh or the back button doesn't resubmit it. After that it runs its normal `handleSubmit`. Because the text came from the other tab, a no-match result there shows the plain message instead of offering to move it back.
- No changes to the AI prompts or the backend.
