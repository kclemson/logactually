# Fix bloodwork tests split by a lab equipment name, e.g. "Ferritin (Roche)"

## What happened

Your November 2 report adds the testing machine's maker after each name: "Ferritin (Roche)", "Transferrin Saturation (Roche)" and so on. The app matches test names to its dictionary exactly. It didn't recognize "Ferritin (Roche)", so it started a new, separate "Ferritin (Roche)" trend instead of adding to Ferritin.

Earlier "(Beckman)" names avoided this only because they were added to the dictionary one by one. Any new machine maker would cause the same split.

In your account, 9 results from that report are affected:

| Printed on report | Should join |
|---|---|
| Ferritin (Roche) | Ferritin |
| Transferrin Saturation (Roche) | Iron Saturation |
| Total Iron Binding Capacity (Roche) | TIBC |
| Transferrin (Roche) | Transferrin |
| Thyroid Stimulating Hormone (Roche) | TSH |
| ALT (Roche), AST (Roche) | ALT, AST |
| Total Bilirubin (Roche), Direct Bilirubin (Roche) | Bilirubin (Total), Bilirubin (Direct) |
| Total Protein (Roche) | Total Protein |

"Iron, SRM" from the same report already linked correctly.

## The fix

1. **More forgiving matching for future uploads.** If a name isn't recognized as printed, the app tries again without the bracketed bit at the end. It only uses that version if the shorter name is a known test. "Ferritin (Roche)" becomes Ferritin, and so would "(Siemens)", "(Abbott)" or anything else in brackets. Names where the bracket matters, like "(Absolute)" counts or "(Dried Blood)" tests, are already matched exactly as printed and stay separate.
2. **Repair your existing results.** Move the 9 results above onto their correct trends, and move any pin you put on a "(Roche)" chart to the matching standard chart. This only touches your account.
3. **Add tests** for "Ferritin (Roche)", "Transferrin Saturation (Roche)" and a made-up maker such as "ALT (Siemens)". Also confirm that "(Absolute)" and "(Dried Blood)" names still stay separate.

## Technical details

- In `canonicalize()` in `src/lib/bloodwork-canonical.ts` and its copy in `supabase/functions/_shared/bloodwork-canonical.ts`: when the exact synonym lookup misses, strip one trailing `( … )` group, normalize and retry. Accept the result only on a dictionary hit, then run the existing unit-aware sibling check. Redeploy `parse-bloodwork`.
- One data update on `bloodwork_results`, limited to your account's id. Re-key the 9 `*_roche` rows and set their `display_name` to the canonical names. Re-key matching entries in your pinned-analyte settings.
- New cases go in `src/lib/bloodwork-canonical.test.ts`, then run that test file.
