# LogActually AI models: results from round 1, and next steps

## What round 1 showed

I ran 9 of your recent food entries and 6 of your exercise entries through five models, using the app's exact instructions. That's one run per model per entry, all sent at the same time.

| Model | Typical wait | Max wait | Notable mistakes |
|---|---|---|---|
| Gemini 3 Flash (today's main model) | 1.4s | 5s | Ignored your label on the tuna: you wrote 135 cal / 11g protein, it logged 103 / 14 |
| Gemini 3.8 Flash (newest Flash) | 6.4s | 23s | None. But it's about 4x slower, likely because it "thinks" before answering by default |
| Gemini 3.1 Flash Lite | 1.2s | 2s | Generic names ("Shortbread cookie" for Abbraccio, "Oat cereal" for Cheerios) |
| GPT-5 mini (today's backup) | 8.1s | 22s | Logged "Trancio di pizza Conad 240g" as white fish (197 cal instead of about 550). OpenAI has also deprecated this model |
| GPT-6 Luna | 6.6s | 23s | Made up a new exercise type, "leg_press_upper". That would split your leg press history into two charts again |

On the exercise entries, all five models got sets, reps, weight and distance right.

## What this means

- **Today's main model is still competitive.** None of the newer models was clearly better at the same speed.
- **Today's backup is the weak link.** It made the worst mistake in the set and it's deprecated. It only runs when the main model fails, but it should still be replaced.
- **Gemini 3.8 Flash's accuracy looked good, but its speed was a dealbreaker as tested.** A 6–23 second wait per food log is a real regression. It may be fast with its "thinking" turned down, but I haven't tested that.
- **I haven't tested food photos, Ask AI or bloodwork yet.**

## Proposed round 2 (testing only, no app changes)

1. Re-run Gemini 3.8 Flash with thinking turned to its lowest setting, on the same 15 entries. If it matches today's speed with equal or better accuracy, it becomes the main-model candidate.
2. Test backup candidates (GPT-6 Luna, GPT-6.1 Terra, Gemini 3.1 Flash Lite) against the same entries. The winner is whichever doesn't invent new exercise types or misidentify foods.
3. Run 3 real food photos and 2 of your past lab reports through the current models and the candidates (Gemini 3.1 Pro for bloodwork). Compare values against what's already saved.
4. Bring you a final side-by-side and a specific model swap for approval. Nothing in the app changes until then.

## Technical details

- The test script lives outside the project, in temporary storage. It imports the real instructions the app's functions use and calls the AI gateway directly. Round 1 results are saved for comparison.
- Caveat: all 75 round-1 requests went out at once, which may have inflated some wait times. Round 2 will send them in smaller batches.
