
# Trim over-specified prompt examples in both charting edge functions

## What's happening

The model is being over-guided by inline examples and trigger-phrase lists that don't add clarity beyond what the rule descriptions already convey. This causes two problems:
1. Specific examples create implicit anchoring — the model pattern-matches on phrasing instead of reasoning from semantics (the `only_keys` / "only walked" bug is caused by exactly this)
2. More text = more surface area for contradictions and stale guidance as the system evolves

## Audit findings

### `generate-chart-dsl/index.ts` (v2 DSL prompt)

**RULE SELECTION GUIDE (lines 224-231)** — Remove entirely. Each of the 7 bullet points is a restatement of the rule description that immediately precedes it (lines 202-222). The descriptions are already semantically unambiguous; the guide only adds risk of mapping errors like the `only_keys` bug.

**CLASSIFICATION EXAMPLES (lines 233-239)** — Trim from 5 to 2. Keep only the two that are genuinely non-obvious:
- `"days I ran vs days I only walked"` → `any_key` (counter-intuitive: "only walked" could suggest `only_keys` but the framing is comparative, so `any_key` on running is correct)
- `"high protein days vs low"` → `threshold` with `source: "food"` (the cross-source requirement isn't obvious from the schema description)

Remove:
- `"rest days vs workout days"` → derivable from the `any_strength` description
- `"leg day vs non-leg day"` → the model should select the keys itself; hard-coding a specific list is brittle
- `"days where I only walked vs days with more"` → the known bug case; removing it lets the `all_cardio` description do the right thing

**`only_keys` rule (lines 210-220)** — The bullet-point sub-rules and the final example are redundant. Trim to the essential semantic content: what the rule means, the two token formats, and the subtype-vs-plain-key guidance (which is genuinely non-obvious).

**ROLLING WINDOW (line 116)** — The trigger-phrase list ("rolling average", "7-day average", "smoothed", "trend line", "moving average") is unnecessary. Remove the phrase list, keep `window=7 for a 7-day trailing average` as the one concrete example (number format, not phrase anchoring).

**CUMULATIVE TRANSFORM (lines 118-119)** — Same pattern. Remove the trigger-phrase list, keep the example since it shows the format.

---

### `generate-chart/index.ts` (v1 prompt)

**SCHEMA_SYSTEM_PROMPT RULES (lines 143-152)** — Four `"for X → do Y"` inline examples are entirely redundant with the groupBy/metric descriptions above them. Remove all four, keep only the remaining two bullets about sort and chart type.

**Common categorical patterns (lines 55-58)** — "by hour of day → 24 buckets labeled 12am–11pm" and "by day of week → 7 buckets, ordered by weekday name" are derivable from the schema. Remove these two sub-bullets, keep the general description of categorical vs time-series.

---

## Changes

Two files:
- `supabase/functions/generate-chart-dsl/index.ts` — remove RULE SELECTION GUIDE, trim CLASSIFICATION EXAMPLES to 2, trim `only_keys` sub-bullets and inline example, remove trigger-phrase lists from ROLLING WINDOW and CUMULATIVE TRANSFORM sections
- `supabase/functions/generate-chart/index.ts` — remove the 4 `→` inline examples from SCHEMA_SYSTEM_PROMPT, remove the 2 "common categorical patterns" sub-bullets

Both edge functions are deployed automatically after saving.
