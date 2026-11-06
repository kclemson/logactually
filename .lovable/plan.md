# Switch everyday AI features to Gemini 3.8 Flash

## What changes

These features currently use Gemini 3 Flash as their main model. They'll switch to Gemini 3.8 Flash with its thinking turned down, the setup that answered in about 2 seconds in testing:

- Logging food from text and photos
- Barcode scans, but only the last-resort step, when Open Food Facts doesn't recognize the barcode even after the padded retry. Normal scans don't use AI at all.
- Logging exercise
- Ask AI on Trends
- Both chart builders
- Populate demo data (admin)

## What stays the same

- **Backup model:** stays GPT-5 mini for now. It only runs when the main model fails. It is deprecated, though, so replacing it is a separate decision for later.
- **Bloodwork report reading:** stays on Gemini 2.5 Pro. It wasn't tested.
- **Everything else:** the app's instructions to the AI, retries and error handling don't change.

## What to watch for

- Food first guesses will differ from before, like the test showed. For example, Gouda defaulted to 1 oz and Reese's to 1 cup. Brand names will also be kept more often ("Starburst" rather than "Fruit Chews").
- **Photo logging wasn't tested.** After deploying, I'll log one test photo and one text entry on your account, check both come back correctly and quickly, then delete them.
- I'll watch the AI request logs for errors or slow responses over the following day.

## Technical details

- In each of 8 functions (`analyze-food`, `analyze-food-photo`, `lookup-upc`, `analyze-weights`, `ask-trends-ai`, `generate-chart`, `generate-chart-dsl`, `populate-demo-data`), the primary model changes from `google/gemini-3-flash-preview` to `google/gemini-3.8-flash`.
- `reasoning_effort: "low"` is added to the request body only when the model is Gemini 3.8 Flash, so the GPT-5 mini fallback request doesn't change.
- Redeploy those 8 functions.
- Add a changelog entry only if you want one.
