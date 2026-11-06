# Bloodwork model: test one candidate on your own reports

## Today

- **Main model:** Gemini 2.5 Pro, from Google's previous Pro generation.
- **Backup:** GPT-5. It only runs if the main model fails.

## Candidate to test

Gemini 3.1 Pro (preview). It's the current version of the same Pro tier, so it's the most direct upgrade. Reading lab reports is rare but hard work: dense tables, inconsistent layouts, and units and reference ranges that are easy to mix up. That's the job the Pro tier is built for.

## The test

One model, not several:

1. Take 2 of your own past lab reports that are already in the app, the original files you uploaded. No other users' data.
2. Run each once through Gemini 3.1 Pro, using the app's exact bloodwork instructions, one at a time.
3. Compare against what's already saved for those reports: test names, values, units, reference ranges and report date. I'll list every difference, plus how long each report took.
4. Report the results to you. Nothing in the app changes, and nothing is saved to your account.

Cost: two Pro-tier requests.

## Technical details

- A throwaway script outside the app imports the real bloodwork instructions and file-handling logic, then calls the AI gateway directly. It reads your report files from storage using your account ID, with no sign-in needed.
- The comparison uses the saved results, so the current model doesn't need to run again.
