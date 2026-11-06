# Bloodwork model: test the cheaper model first

## Today

- **Main model:** Gemini 2.5 Pro, from Google's previous Pro generation.
- **Backup:** GPT-5. It only runs if the main model fails.

## Candidate to test first

Gemini 3.8 Flash, the same model the everyday features now use. It's newer than today's bloodwork model, and from the gateway price list it's less than half the per-word cost of Gemini 3.1 Pro.

Whether it's good enough is an open question. Lab reports are the hardest reading the app does: dense tables, inconsistent layouts, and units and reference ranges that are easy to mix up. The test below answers that directly. We'd only try Gemini 3.1 Pro if Flash makes mistakes.

## The test

One model only:

1. Take 2 of your own past lab reports that are already in the app, the original files you uploaded. No other users' data.
2. Run each once through Gemini 3.8 Flash, using the app's exact bloodwork instructions, one at a time. Its thinking stays on its default setting for this test: speed matters less for an occasional upload, and accuracy matters more.
3. Compare against what's already saved for those reports: test names, values, units, reference ranges and report date. I'll list every difference, plus how long each report took.
4. Report the results to you. Nothing in the app changes, and nothing is saved to your account.

## Technical details

- A throwaway script outside the app imports the real bloodwork instructions and file-handling logic, then calls the AI gateway directly. It reads your report files from storage using your account ID, with no sign-in needed.
- The comparison uses the saved results, so the current model doesn't need to run again.
