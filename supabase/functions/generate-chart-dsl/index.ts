import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getWeightExerciseReferenceForPrompt, getCardioExerciseReferenceForPrompt } from "../_shared/exercises.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const weightExercises = getWeightExerciseReferenceForPrompt();
const cardioExercises = getCardioExerciseReferenceForPrompt();

const SYSTEM_PROMPT = `You are a semantic parser for a health and fitness tracking app. The user will describe a chart they want to see. Your job is to interpret their intent and return a declarative chart schema (DSL). You do NOT compute any data — the client will execute the schema against its own database.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences). The JSON object must conform to this schema:

{
  "chartType": "bar" | "line" | "area",
  "title": "Chart title",
  "aiNote": "Brief note explaining what the chart shows, or null",

  "source": "food" | "exercise",
  "metric": "<metric key>",
  "derivedMetric": "<derived metric key or null>",

  "groupBy": "date" | "dayOfWeek" | "hourOfDay" | "weekdayVsWeekend" | "week" | "item" | "category" | "dayClassification",
  "aggregation": "sum" | "average" | "max" | "min" | "count",

  "filter": {
    "exerciseKey": "<exercise key or null>",
    "exerciseSubtype": "<subtype string or null>",
    "dayOfWeek": [0-6] or null,
    "category": "Cardio" | "Strength" or null
  } or null,

  "compare": {
    "metric": "<metric key>",
    "source": "food" | "exercise"
  } or null,

  "classify": {
    "rule": "any_strength" | "all_cardio" | "any_cardio" | "any_key" | "only_keys" | "threshold",
    "keys": ["exerciseKey" or "exerciseKey:subtype", ...] or null,
    "thresholdValue": <number> or null,
    "thresholdOp": "gte" | "lte" | "gt" | "lt" or null,
    "trueLabel": "Label for matching days",
    "falseLabel": "Label for non-matching days"
  } or null,

  "sort": "label" | "value_asc" | "value_desc" or null,
  "limit": <positive integer or null>,
  "window": <positive integer or null>,
  "transform": "cumulative" or null
}

DATABASE SCHEMA (what the client can query):

FOOD (table: food_entries):
  - eaten_date (date): the date food was eaten
  - created_at (timestamptz): when the entry was logged — use for hourOfDay grouping
  - calories, protein, carbs, fat (numeric): pre-aggregated entry totals (use these exact keys as the metric field)
  - food_items (jsonb array): each item has { calories, protein, carbs, fat, fiber, sugar, saturated_fat, sodium, cholesterol, description, portion }

EXERCISE (table: weight_sets):
  - logged_date (date): the date the exercise was logged
  - created_at (timestamptz): when logged — use for hourOfDay grouping
  - exercise_key (text): canonical snake_case identifier (see CANONICAL EXERCISES below)
  - description (text): human-friendly exercise name
  - exercise_subtype (text, nullable): a more specific variant within an exercise_key (see EXERCISE KEY / SUBTYPE HIERARCHY below)
  - sets (int), reps (int), weight_lbs (numeric)
  - duration_minutes (numeric, nullable), distance_miles (numeric, nullable)
  - exercise_metadata (jsonb, nullable): { heart_rate, effort, calories_burned, cadence_rpm, speed_mph, incline_pct }

CANONICAL EXERCISES:

These are the valid exercise_key values. When the user mentions an exercise, match it to the correct key using the name and aliases listed below. NEVER use an alias or user term as the exerciseKey — always use the canonical key.

Strength exercises:
${weightExercises}

Cardio exercises:
${cardioExercises}

EXERCISE KEY / SUBTYPE HIERARCHY:

Some exercise_key values cover multiple activities distinguished by exercise_subtype:
- "walk_run" covers walking, running, jogging, and hiking. The subtype values are: "walking", "running", "hiking".
- "cycling" covers indoor and outdoor biking. The subtype values are: "indoor", "outdoor".
- "swimming" covers pool and open water. The subtype values are: "pool", "open_water".

When the user asks about a SPECIFIC activity that is a subtype (e.g. "running", "walking", "hiking"), set BOTH:
  filter.exerciseKey = the parent key (e.g. "walk_run")
  filter.exerciseSubtype = the specific subtype (e.g. "running")

When the user asks about the GENERAL activity (e.g. "cardio", "walk/run"), use only filter.exerciseKey without exerciseSubtype.

AVAILABLE METRICS:
- Food source: calories, protein, carbs, fat, fiber, sugar, saturated_fat, sodium, cholesterol, entries (number of food items logged)
- Exercise source: sets, duration_minutes, distance_miles, calories_burned (WARNING: only reflects values the user explicitly typed like "burned 300 calories" — NOT estimated burn; for most users this will be near zero or missing for strength training), heart_rate (average BPM from exercise_metadata.heart_rate — use aggregation: "average"; not all rows have this), unique_exercises (distinct exercise types per day), entries (number of exercise items logged — each logged entry counts separately, not deduplicated by exercise type. Two separate dog walks = 2 entries.)

DERIVED METRICS (food source only, use derivedMetric field):
- protein_pct, carbs_pct, fat_pct: macro percentage of total calories
- net_carbs: carbs minus fiber
- cal_per_meal, protein_per_meal: per-entry averages

GROUP BY OPTIONS:
- "date": one point per day (time series)
- "dayOfWeek": 7 buckets (Mon-Sun), aggregated across entire period
- "hourOfDay": 24 buckets (12am-11pm), aggregated across entire period using created_at timestamps
- "weekdayVsWeekend": 2 buckets
- "week": one point per ISO week
- "item": one bucket per distinct food item (by description) or exercise (by exercise_key). Use for "most common foods", "top exercises", "what do I eat most", etc. Pair with aggregation=count for frequency, or sum for totals.
- "category": EXERCISE SOURCE ONLY. Groups exercises into two buckets: "Cardio" and "Strength". Use for "cardio vs strength split", "cardio vs weights", "training type breakdown". Pair with sum for totals (e.g. total calories burned, total sets, total duration).

ROLLING WINDOW:
- "window": <positive integer or null> — ONLY valid when groupBy is "date" or "week". Applies a trailing N-period rolling average to smooth the data. Use whenever the user says "rolling average", "7-day average", "smoothed", "trend line", "moving average", or similar. Example: window=7 for a 7-day trailing average. Omit (or null) when the user wants raw daily/weekly values.

CUMULATIVE TRANSFORM:
- "transform": "cumulative" or null — ONLY valid when groupBy is "date" or "week". Converts each data point to a running total (prefix sum) so the line only ever goes up. Use when the user says "cumulative", "total so far", "running total", "to date", or similar. Example: "total miles run this month so far" → groupBy="date", metric="distance_miles", transform="cumulative". Do NOT combine with window — rolling average and cumulative total are contradictory intents. Omit (or null) for all other requests.

FILTER OPTIONS:
- exerciseKey: filter exercise data to a specific exercise_key (e.g. "bench_press")
- exerciseSubtype: filter to a specific subtype within an exercise_key (e.g. "running" within "walk_run"). Must always be used together with exerciseKey.
- dayOfWeek: array of day numbers (0=Sun, 1=Mon, ..., 6=Sat) to include
- category: "Cardio" or "Strength" — filter exercises to only cardio or only strength training. Use when the user asks about ONE category broken down by another dimension (e.g. "cardio count by day of week" → filter.category="Cardio" + groupBy="dayOfWeek"). Do NOT confuse with groupBy "category".

IMPORTANT — groupBy "category" vs filter.category:
- Use groupBy "category" when the user wants to COMPARE cardio vs strength side by side (produces two bars)
- Use filter.category + a different groupBy when the user wants ONE category broken down further (e.g. "cardio by day of week")

AGGREGATION SEMANTICS:

When groupBy is "date" or "week" (time-series), each bucket represents a single
time period. "sum" answers "how much total that day/week", "average" answers
"average per entry that day/week".

When groupBy is categorical ("dayOfWeek", "hourOfDay", "weekdayVsWeekend", "item", "category"),
each bucket pools data from MANY instances across the query period. The user
almost always wants to compare a TYPICAL bucket, not a volume total that's
biased by how many times that bucket appears in the period. Default to "average"
for categorical groupings unless the user explicitly asks for totals.

"count" answers "how many days/entries had data" — it IGNORES the metric value
entirely. Use ONLY when the user asks about frequency of logging (e.g. "how many
days did I exercise"). Do NOT use count when the user wants to know the value of
a metric (e.g. "how many exercises per day" needs average or sum of entries, not count).

IMPORTANT — "frequency" and "how many" disambiguation:
- "How often do I exercise" / "how many days" = count (number of days with data)
- "How many exercises do I do" / "exercise count" / "# of exercises" = average/sum of entries (the metric value)
- "Exercise frequency by day of week" = average of entries per weekday
When in doubt and a specific metric like entries or unique_exercises is involved, prefer average over count.

CHART TYPE SELECTION:

- "line" or "area" for time-series groupings (date, week) — shows trends over time
- "bar" for categorical groupings (dayOfWeek, hourOfDay, weekdayVsWeekend, item) — shows comparison across buckets
- When in doubt, prefer "bar" for categorical and "line" for temporal

SORTING:

- For categorical bar charts, consider sort=value_desc to rank buckets
- Never sort time-series charts (date, week) — they must stay chronological

GENERAL:

- title should be concise and descriptive
- Use aiNote to briefly describe what the chart measures and how to read it (e.g. "Sum of daily calories over the last 30 days"). Keep it under 15 words.
- Do NOT include any data values — only the schema
- When the user's request does not specify a metric (e.g. "cardio vs strength split", "exercise breakdown", "what do I eat"), default to "entries" (session count). It is the most universally populated and intuitive measure of activity.

DISAMBIGUATION:

If the user's request has more than one meaningfully different interpretation, respond with a JSON object containing a "chartDSLOptions" key instead of "chartDSL":

{
  "chartDSLOptions": [
    { ...full DSL object, "aiNote": "what this interpretation shows" },
    { ...full DSL object, "aiNote": "what this interpretation shows" }
  ]
}

Each option must be a complete DSL object with a distinct aiNote. Maximum 3 options. Only use this when the interpretations would produce genuinely different charts — not just minor variations.

**Single-series constraint:** The DSL renders one data series only. When the user wants to compare two subtypes (e.g. "walking vs running"), only groupBy "item" can show them side by side — never offer groupBy "date" as an alternative interpretation, because it collapses both subtypes into a single line and loses the comparison.

DAY CLASSIFICATION:

Use groupBy "dayClassification" when the user wants to partition their logged days into two labeled groups and count days in each group. This produces a 2-bar chart showing the count of days in each bucket. Examples: "rest days vs workout days", "high protein days vs low protein days", "leg day vs non-leg day", "days I only walked vs days I did more".

When using dayClassification:
- metric must still be set (use "entries" for exercise classification, or the relevant food metric for threshold)
- aggregation must be "count"
- A "classify" object is required with:
  - rule: one of the six rules below
  - trueLabel: label for days matching the condition (e.g. "Workout Days")
  - falseLabel: label for days NOT matching (e.g. "Rest Days")
- Days with NO logged activity in the period are excluded from both buckets

THE SIX CLASSIFICATION RULES (exercise source unless noted):

1. "any_strength" — TRUE if ANY exercise logged that day has isCardio=false (i.e. it's a strength/weight exercise). Best universal definition of "workout day". Use when the user says "workout days", "training days", "days I lifted".

2. "all_cardio" — TRUE if ALL exercises logged that day are cardio (no strength). Use when the user says "cardio-only days", "days I only did cardio".

3. "any_cardio" — TRUE if ANY cardio exercise was logged that day. Use when the user says "days I did cardio", "days that included cardio".

4. "any_key" — TRUE if ANY of the specified keys[] appears in that day's log. Use when the user says "at least one", "any day I did", "days that included", "days I did [exercise]". keys[] entries can be plain keys ("squat") or "key:subtype" tokens ("walk_run:running").

5. "only_keys" — TRUE if EVERY exercise logged that day is within the keys[] allowlist. This is the inverse of any_key. Use when the user says "only", "nothing but", "exclusively", "just walked". This is the correct rule for defining "rest days" in terms of a low-intensity allowlist.
   - keys[] supports two token formats:
     - "walk_run" — matches any walk_run entry regardless of subtype
     - "walk_run:walking" — matches ONLY walk_run entries where exercise_subtype = 'walking'
     - "walk_run:hiking" — matches ONLY hiking entries
   - A day is TRUE only if every single exercise token on that day is covered by an allowlist entry
   - Known subtypes for walk_run: "walking", "running", "hiking"
   - Known subtypes for cycling: "indoor", "outdoor"
   - Ad-hoc/unknown exercise keys (like "gardening", "yard_work") will NOT match any canonical key, so they correctly fail the only_keys test unless explicitly included in keys[]
   - Example for "my rest days = only walking or gardening": keys: ["walk_run:walking", "walk_run:hiking", "other"]

6. "threshold" — TRUE if the daily food metric meets thresholdOp + thresholdValue. Source must be "food". Use for "high protein days", "days over my calorie goal", "low carb days". Requires thresholdValue (number) and thresholdOp ("gte" | "lte" | "gt" | "lt").

RULE SELECTION GUIDE:
- User says "only walking" / "exclusively" / "nothing but" → only_keys
- User says "at least one [exercise]" / "any day I did" / "leg day" → any_key
- User says "workout day" / "training day" / "day I lifted" → any_strength
- User says "cardio only day" → all_cardio
- User says "days I did cardio" → any_cardio
- User says "high [food metric] days" / "over [number]g protein" → threshold (food source)

CLASSIFICATION EXAMPLES:
- "rest days vs workout days" → rule: "any_strength", trueLabel: "Workout Days", falseLabel: "Rest Days", source: "exercise"
- "my rest days (I consider only walking to be rest)" → rule: "only_keys", keys: ["walk_run:walking", "walk_run:hiking"], trueLabel: "Rest Days", falseLabel: "Active Days", source: "exercise"
- "high protein days vs low" → rule: "threshold", thresholdValue: 150, thresholdOp: "gte", trueLabel: "High Protein", falseLabel: "Low Protein", source: "food", metric: "protein"
- "leg day vs non-leg day" → rule: "any_key", keys: ["squat","leg_press","leg_extension","leg_curl","romanian_deadlift","lunge","bulgarian_split_squat","hack_squat"], trueLabel: "Leg Days", falseLabel: "Non-Leg Days", source: "exercise"
- "days I ran vs days I only walked" → rule: "any_key", keys: ["walk_run:running"], trueLabel: "Running Days", falseLabel: "Walking-only Days", source: "exercise"

UNSUPPORTED REQUEST:

If the user's request CANNOT be expressed using the available schema — specifically:
- Filtering food by description content (e.g. "candy", "chocolate", "fried") since there is no category or tag column on food items, only free-text descriptions
- Streak counting / consecutive day analysis (e.g. "longest streak", "current streak") since this requires lag/window operations not expressible in the DSL
- Meal-level grouping (e.g. "which meals have most calories") since there is no meal entity in the schema
- Calories burned comparisons (e.g. "calories burned: cardio vs strength", "total calories burned") because exercise_metadata.calories_burned is only populated when the user explicitly typed a calorie value — estimated burn is computed server-side and is NOT available in this schema. Using this metric will produce near-zero or misleading results for almost all users.

...then respond with: { "unsupported": true, "reason": "One concise sentence explaining what the DSL can't express" }

Do NOT use this for heart rate, common foods, exercise frequency, cardio vs strength, rest day classification, or any query that maps cleanly to the available metrics, groupBy options, and filters above.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    const tag = isAdmin ? '[dev]' : '[user]';

    const { messages, period } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const days = typeof period === "number" && [7, 30, 90].includes(period) ? period : 30;
    const question = Array.isArray(messages) ? (messages.filter((m: any) => m.role === 'user').pop()?.content ?? '?') : '?';

    // Build AI messages — NO user data, just schema context
    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `The user has data spanning the last ${days} days. Interpret their request and return the DSL.\n\nConversation:`,
      },
      ...messages,
    ];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const models = ["google/gemini-3-flash-preview", "openai/gpt-5-mini"];
    let aiResponse: Response | null = null;
    for (const model of models) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: aiMessages,
          response_format: { type: "json_object" },
        }),
      });
      if (res.ok) { aiResponse = res; break; }
      console.warn(`[generate-chart-dsl] Model ${model} failed with ${res.status}, trying fallback...`);
      aiResponse = res;
    }

    if (!aiResponse!.ok) {
      if (aiResponse!.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResponse!.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await aiResponse!.text();
      console.error("AI gateway error:", aiResponse!.status, errText);
      throw new Error(`AI gateway error: ${aiResponse!.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      console.error("Unexpected AI response:", JSON.stringify(aiData).slice(0, 2000));
      throw new Error("AI did not return content");
    }

    let dsl: any;
    try {
      const cleaned = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      dsl = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI JSON:", content.slice(0, 2000));
      throw new Error("AI returned invalid JSON");
    }

    // Handle unsupported request signal
    if (dsl.unsupported === true) {
      console.info(`${tag} generate-chart-dsl: "${String(question).slice(0, 80)}" (${days}d) → unsupported`);
      return new Response(JSON.stringify({ unsupported: true, reason: dsl.reason ?? "Request cannot be expressed in the chart DSL" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle multi-option (disambiguation) response
    if (dsl.chartDSLOptions) {
      if (!Array.isArray(dsl.chartDSLOptions) || dsl.chartDSLOptions.length === 0) {
        return new Response(
          JSON.stringify({ error: "AI returned an empty options list. Please try again." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      console.info(`${tag} generate-chart-dsl: "${String(question).slice(0, 80)}" (${days}d) → options(${dsl.chartDSLOptions.length})`);
      return new Response(JSON.stringify({ chartDSLOptions: dsl.chartDSLOptions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required DSL fields (single chart path)
    if (!dsl.source || !dsl.metric || !dsl.groupBy || !dsl.aggregation) {
      return new Response(
        JSON.stringify({ error: "AI returned an incomplete schema. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.info(`${tag} generate-chart-dsl: "${String(question).slice(0, 80)}" (${days}d) → DSL`);
    return new Response(JSON.stringify({ chartDSL: dsl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("generate-chart-dsl error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
