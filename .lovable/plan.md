# Robust bloodwork canonicalization + Option 3 dictionary

## Decision (method variants)
Go with **Option 3**: fold **Beckman** instrument variants into the standard analyte (same venous serum), keep **Dried Blood / finger-prick** tests as their own separate series. This lengthens trustworthy lab trends without blending home-kit results that can read differently.

## Scope of this plan
1. Add the missing real-world variants to the canonical dictionary (the "cheapest first" synonym foundation).
2. Add a comprehensive unit test that exercises **every** synonym and display name in the dictionary and guards against silent breakage.

This plan does **not** include the one-time backfill of your existing 385 rows — that's the natural next step once the dictionary is solid and verified by the tests.

## 1. Dictionary additions
Both copies stay byte-for-byte identical: `src/lib/bloodwork-canonical.ts` and `supabase/functions/_shared/bloodwork-canonical.ts`.

Add synonyms for the pure naming/abbreviation splits seen in the data:

- `iron_serum`: add `iron srm` (handles "Iron, SRM")
- `folate`: add `folate srm`
- `co2`: add `carbon dioxide total`
- `chol_hdl_ratio`: add `t chol/hdl ratio`, `t. chol/hdl ratio`
- `ldl_cholesterol`: add `ldl chol calc nih` ("LDL Chol Calc (NIH)")
- `egfr`: add `egfr by ckd-epi 2021`, `egfr ckd epi`, `egfr ckd-epi`
- `basophils_pct`: add `basos`
- `eosinophils_pct`: add `eos`
- `eosinophils_abs`: add `eos absolute`, `absolute eosinophil count`
- `lymphocytes_pct`: add `lymphs`
- `lymphocytes_abs`: add `lymphs absolute`, `absolute lymphocyte count`
- `neutrophils_pct`: add `neutrophils percent` (already present), confirm `neut` covered

Option 3 method handling:
- **Beckman** → add the Beckman labels as synonyms of the existing standard analytes so they merge: `ast beckman` → `ast`, `alt beckman` → `alt`, `bilirubin total beckman` → `bilirubin_total`, `total protein beckman` → `protein_total`. (Normalization already strips punctuation, so "AST (Beckman)" collapses to `ast beckman`.)
- **Dried Blood** → add **new dedicated canonical entries** (separate keys) so they stay their own series instead of falling back to fragile auto-slugs: e.g. `total_cholesterol_db`, `hdl_cholesterol_db`, `hba1c_db`, `triglycerides_db`, `ldl_cholesterol_db`, each with their dried-blood synonyms (`cholesterol dried bld`, `hdl dried blood`, `a1c dried blood`, etc.).

## 2. Comprehensive test
New file: `src/lib/bloodwork-canonical.test.ts` (Vitest, matching existing `*.test.ts` conventions).

Coverage:
- **Every synonym maps to its entry** — iterate `BLOODWORK_CANONICAL`; for each entry, for each synonym, assert `canonicalize(synonym).canonical_key === entry.key` and `display_name === entry.display`.
- **Every display name round-trips** — `canonicalize(entry.display).canonical_key === entry.key`.
- **Case / punctuation / spacing robustness** — assert representative variants survive normalization: upper-case, extra spaces, comma forms (`"Iron, SRM"`, `"Cholesterol, Total"`), parenthetical instrument forms (`"AST (Beckman)"`).
- **No synonym collisions** — build the normalized synonym→key map and assert no normalized string maps to two different keys (this is the test that catches a new synonym accidentally stealing another analyte's identity). Fails loudly listing the offending strings.
- **Beckman merges, Dried Blood stays separate** — explicit assertions: `"AST (Beckman)"` → `ast`; `"Cholesterol, Dried Bld"` → a `*_db` key distinct from `total_cholesterol`.
- **Unknown fallback** — an unrecognized name returns a slugged key + trimmed raw display (documents current behavior).

## Technical notes
- `canonicalize`, `BLOODWORK_CANONICAL`, and the `normalize` logic are already exported/available in `src/lib/bloodwork-canonical.ts`; the collision test will reproduce the same `normalize` rules to build its index. If needed, `normalize` will be exported so the test uses the exact production function rather than a copy.
- The Deno `_shared` copy is identical; the Vitest run over the `src/lib` copy is the source of truth for correctness. (A matching Deno test can be added later if you want CI parity on the edge function.)

## Verification
- Run the new Vitest file and confirm all dictionary entries pass and no collisions are reported.
- Build stays green.
