
# Refined `dayClassification` DSL: handling intensity within cardio

## The problem with the previous design

The previous `classify` rules (`any_strength`, `all_cardio`, `any_key`, `threshold`) treat all cardio as equivalent. But "rest day" semantics require distinguishing *intensity within cardio*: walking is low-intensity, running is not; leisure cycling might be, aggressive interval cycling is not.

The schema already encodes this nuance:
- `exercise_key` distinguishes activity type (`walk_run`, `cycling`, `rowing`, etc.)
- `exercise_subtype` distinguishes variants within a key (`walking`, `running`, `hiking` for `walk_run`)
- Ad-hoc activities (gardening, etc.) are stored as free-form `exercise_key` values that won't match any canonical cardio key

The missing rule is: **"this day contained only activities from a low-intensity allowlist"** — which is the inverse of `any_key`. We need `only_keys`: a day is TRUE if every exercise key (and optionally subtype) logged that day is within a specified allowlist.

## Revised rule set

```
rule: "any_strength"   — day is TRUE if ANY exercise logged has isCardio=false
rule: "all_cardio"     — day is TRUE if ALL exercises logged are cardio
rule: "any_cardio"     — day is TRUE if ANY cardio exercise was logged
rule: "any_key"        — day is TRUE if ANY of keys[] appears on that day
rule: "only_keys"      — day is TRUE if EVERY exercise on that day is within keys[] (optionally matched by subtype too)
rule: "threshold"      — day is TRUE if daily metric value meets thresholdOp + thresholdValue (food source)
```

The new `only_keys` rule is what makes "rest day" semantics work correctly.

## How key+subtype matching works for `only_keys`

The `keys` array supports two formats:
- `"walk_run"` — matches any `walk_run` entry regardless of subtype
- `"walk_run:walking"` — matches only `walk_run` entries where `exercise_subtype = 'walking'`
- `"walk_run:hiking"` — matches only hiking entries

So "your rest day" definition becomes:

```json
{
  "classify": {
    "rule": "only_keys",
    "keys": ["walk_run:walking", "walk_run:hiking", "other"],
    "trueLabel": "Rest Days",
    "falseLabel": "Active Days"
  }
}
```

This correctly handles:
- Walk logged with subtype `walking` → rest day ✓
- Walk logged with subtype `running` → NOT a rest day ✓
- `gardening` (ad-hoc key, not in allowlist) → NOT a rest day ✓
- `bench_press` (strength) → NOT a rest day ✓

And for someone who considers moderate cycling a rest day:

```json
{
  "classify": {
    "rule": "only_keys",
    "keys": ["walk_run:walking", "cycling"],
    "trueLabel": "Rest Days",
    "falseLabel": "Workout Days"
  }
}
```

## What `exerciseKeysByDate` needs to store

The current `seenKeys` in `chart-data.ts` (line 253) stores just `exercise_key`. To support subtype matching, it needs to store **compound tokens** of the form `key` and `key:subtype` per day:

```ts
// For each row, add both the plain key AND the key:subtype variant (if subtype exists)
seenKeys[date].add(row.exercise_key);               // e.g. "walk_run"
if (row.exercise_subtype) {
  seenKeys[date].add(`${row.exercise_key}:${row.exercise_subtype}`); // e.g. "walk_run:walking"
}
```

Then in `executeDSL`, the `only_keys` rule checks: for every token in that day's set, is it covered by the allowlist? An allowlist entry of `"walk_run"` covers any `walk_run` token (both `walk_run` and `walk_run:walking`). An allowlist entry of `"walk_run:walking"` covers ONLY `walk_run:walking`, not bare `walk_run` or `walk_run:running`.

## Full classification examples

| User query | AI-generated classify |
|---|---|
| "rest days vs workout days" (basic) | `rule: "any_strength"`, truLabel: "Workout", falseLabel: "Rest" |
| "my rest days (only walking)" | `rule: "only_keys"`, keys: `["walk_run:walking", "walk_run:hiking"]`, true: "Rest", false: "Active" |
| "days I only did cardio" | `rule: "all_cardio"`, true: "Cardio-only", false: "Included Strength" |
| "leg day vs non-leg day" | `rule: "any_key"`, keys: `["squat","leg_press","leg_extension","leg_curl","romanian_deadlift","lunge","bulgarian_split_squat","hack_squat","step_up"]`, true: "Leg Day", false: "Non-Leg Day" |
| "high protein days (≥150g)" | `rule: "threshold"`, thresholdValue: 150, thresholdOp: "gte", true: "High Protein", false: "Low Protein" |
| "days I ran vs days I only walked" | Two separate `dayClassification` charts OR single chart with `rule: "any_key"`, keys: `["walk_run:running"]`, true: "Running Days", false: "Walking-only Days" |

## What the AI needs to know (prompt additions)

The `generate-chart-dsl` system prompt needs a `DAY CLASSIFICATION` section that:

1. Lists all six rules with concise definitions
2. Explains the `key:subtype` notation for the `only_keys` allowlist
3. Lists the known subtypes for `walk_run`: `walking`, `running`, `hiking`, `indoor`, `outdoor`
4. Explains that ad-hoc/unknown exercise keys (like `gardening`) will NOT match any canonical key, so `only_keys` will correctly exclude them if they're not in the allowlist
5. Clarifies that `only_keys` is the right rule when the user says "only", "nothing but", "just walked", "exclusively"
6. Clarifies that `any_key` is right when the user says "at least one", "any day I did", "days that included"
7. Notes that days with zero exercise are excluded from both buckets

## Files changing

| File | Change |
|---|---|
| `src/lib/chart-types.ts` | Add `"dayClassification"` to `groupBy` union; add `classify?` object to `ChartDSL`; add `exerciseKeysByDate?: Record<string, string[]>` to `DailyTotals` |
| `src/lib/chart-data.ts` | In `fetchExerciseData`: always populate `exerciseKeysByDate` using compound `key` + `key:subtype` tokens from already-iterated rows (no new DB query) |
| `src/lib/chart-dsl.ts` | Add `case "dayClassification"`: iterate `exerciseKeysByDate` or `food` by date, apply classify rule, return two labeled count bars |
| `supabase/functions/generate-chart-dsl/index.ts` | Add `DAY CLASSIFICATION` section to SYSTEM_PROMPT documenting all 6 rules, `key:subtype` notation, known subtypes, and rule-selection guidance; remove "Gap or streak analysis" from UNSUPPORTED |

No schema changes. No new DB queries. The subtype data is already fetched in the existing `weight_sets` select (line 158 of `chart-data.ts` already includes `exercise_subtype`).

## What remains unsupported (unchanged)

- Gap analysis / streak counting (consecutive days)
- 3-way+ classification in one chart
- Cross-source classification (days I hit protein goal AND worked out)
- Food-side `only_keys` (not needed; threshold covers food classification)
