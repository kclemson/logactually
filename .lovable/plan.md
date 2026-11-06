# LogActually AI model refresh

## What the app uses today

| Feature | Primary | Backup |
|---|---|---|
| Food from text, photo or barcode | Gemini 3 Flash (preview) | GPT-5 mini |
| Exercise logging | Gemini 3 Flash (preview) | GPT-5 mini |
| Ask AI, both chart builders, demo data | Gemini 3 Flash (preview) | GPT-5 mini |
| Bloodwork report reading | Gemini 2.5 Pro | GPT-5 |

You were right: every one of these is now a generation or more behind what's available.

## What's newer (checked against the live model list today)

Prices are relative to what the everyday features pay now (1x = Gemini 3 Flash today):

- **Gemini 3.8 Flash.** The newest model in the same fast tier. It costs about 1.5x for the text we send. Same speed class.
- **Gemini 3.1 Flash Lite.** About half the cost. It's built for simple, high-volume extraction work.
- **GPT-6 Luna.** OpenAI's newest low-cost model. It's cheaper than the GPT-5 mini backup it would replace.
- **Gemini 3.1 Pro (preview) and GPT-6.1 Sol.** The current strong models, meant for hard reading like lab reports.
- I'm leaving out GPT-6 Astra, the top model. It costs roughly 20x per call and is slower. That's wrong for something you tap many times a day.

## Recommendation

1. **Everyday features: move to Gemini 3.8 Flash, with GPT-6 Luna as the backup.** We stay in the same speed tier and get the newest generation. The cost increase is small in absolute terms, because each food log is a short request.
2. **Bloodwork: move to Gemini 3.1 Pro (preview), with GPT-6.1 Sol as the backup.** It's rare, high-stakes and hard to read, so it gets the strong tier.
3. **Don't switch blind: compare old and new models on real inputs first.** I'll run a fixed set of real-world inputs through both. That means about 10 food descriptions, 3 food photos, 5 exercise entries, 3 Ask AI questions and 2 of your past lab reports. Then I'll show you the results side by side: accuracy of calories and macros, exercise names and weights, lab values and dates, plus response time. Each feature only switches if the new model is as good or better. Otherwise it stays where it is.

## Technical details

- One model-pair constant per edge function: `analyze-food`, `analyze-food-photo`, `lookup-upc`, `analyze-weights`, `ask-trends-ai`, `generate-chart`, `generate-chart-dsl`, `populate-demo-data`, `parse-bloodwork`. Keep the existing fallback order, retries and output limits. Adjust request parameters only where a new model requires it. For example, GPT-5.6 and newer models need an explicit reasoning-effort setting when called through the fallback path.
- The comparison runs as a throwaway script against the gateway, not inside the app. Users see nothing until the switch is deployed.
- Redeploy the changed functions, then check the AI request logs for errors and response times over the following day.
