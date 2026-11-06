# LogActually AI model review

## What every AI call uses today

| Feature | Primary | Backup if primary fails |
|---|---|---|
| Food from text | Gemini 3 Flash (preview) | GPT-5 mini |
| Food from photo | Gemini 3 Flash (preview) | GPT-5 mini |
| Barcode lookup fill-in | Gemini 3 Flash (preview) | GPT-5 mini |
| Exercise logging | Gemini 3 Flash (preview) | GPT-5 mini |
| Ask AI (Trends) | Gemini 3 Flash (preview) | GPT-5 mini |
| Chart builders (both) | Gemini 3 Flash (preview) | GPT-5 mini |
| Populate demo data (admin) | Gemini 3 Flash (preview) | GPT-5 mini |
| Bloodwork report reading | Gemini 2.5 Pro | GPT-5 |

## Recommendation

- **Keep the everyday features as they are.** Gemini 3 Flash is still the right speed and cost for actions you take many times a day. A Pro-tier model would add a few seconds to every log, and you wouldn't see a matching gain in accuracy. GPT-5 mini is still a good backup.
- **Upgrade bloodwork reading to Gemini 3 Pro (preview).** It's the only feature on an older model. It also does the hardest reading of anything here: dense, inconsistently formatted lab PDFs. Uploads are rare, so the extra cost per report doesn't matter. Keep GPT-5 as its backup.

## Change

- Swap the bloodwork primary model from Gemini 2.5 Pro to Gemini 3 Pro (preview). Nothing else changes.
- Then re-upload one existing lab report and check that every value and date still comes out correctly. The duplicate-report check should catch the same file without adding a second copy.

## Technical details

- One edit: `supabase/functions/parse-bloodwork/index.ts` line ~199, `google/gemini-2.5-pro` → `google/gemini-3-pro-preview`, then redeploy that function.
