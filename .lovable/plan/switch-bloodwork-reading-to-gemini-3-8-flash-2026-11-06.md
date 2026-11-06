# Switch bloodwork reading to Gemini 3.8 Flash

## Test results

I ran each of your two reports once through Gemini 3.8 Flash, using the app's exact bloodwork instructions, and compared the results with what's saved in your account.

**June 21, 2024 Labcorp report (51 results)**
- Found all 51 results. Values, units and the collection date all matched what's saved.
- 3 small differences, all in the reference ranges or flags:
  - **eGFR and HDL:** it filled in a lower limit (more than 59, more than 39) that the saved version left blank. The report prints these as "more than" limits.
  - **VLDL:** it dropped a "Low" flag that's in the saved version.
- Took 19 seconds.

**`document.pdf`**
- This turned out to be your **March 30, 2026** report (26 results, 2 pages), not the January 30 one. Both files are named `document.pdf`. I compared it against the matching March 30 report in your account.
- 26 of 26 results matched exactly: values, units, reference ranges, flags and the date.
- Took 10 seconds.

**Bottom line:** 77 results checked. Every value, unit and date matched, with 3 minor differences in reference ranges or flags, two of which look like improvements. Today's model, Gemini 2.5 Pro, isn't needed for this work, so there's no case for a Pro-tier model.

## Change

- Bloodwork reading switches from Gemini 2.5 Pro to Gemini 3.8 Flash, with its thinking left at the default setting, the same as in the test.
- The backup stays GPT-5. Instructions, duplicate-report detection and everything else stay the same.
- Existing saved reports aren't re-read or changed.

## Technical details

- `supabase/functions/parse-bloodwork/index.ts`: the primary model in the call changes from `google/gemini-2.5-pro` to `google/gemini-3.8-flash`, with no reasoning-effort override. Then redeploy `parse-bloodwork`.
