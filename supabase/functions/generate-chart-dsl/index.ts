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

  "source": "food" | "exercise",
  "metric": "<metric key>",
  "derivedMetric": "<derived metric key or null>",

  "groupBy": "date" | "dayOfWeek" | "hourOfDay" | "weekdayVsWeekend" | "week" | "item" | "category",
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

  "sort": "label" | "value_asc" | "value_desc" or null,
  "limit": <positive integer or null>
}

DATABASE SCHEMA (what the client can query):

FOOD (table: food_entries):
  - eaten_date (date): the date food was eaten
  - created_at (timestamptz): when the entry was logged — use for hourOfDay grouping
  - total_calories, total_protein, total_carbs, total_fat (numeric): pre-aggregated entry totals
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
- Food source: cal, protein, carbs, fat, fiber, sugar, sat_fat, sodium, chol, entries (number of food logging sessions)
- Exercise source: sets, duration, distance, cal_burned, unique_exercises (distinct exercise types per day), entries (number of exercise sessions logged — each logged group counts separately, not deduplicated by exercise type. Two separate dog walks = 2 entries.)

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
- Do NOT include any data values — only the schema
- When the user's request does not specify a metric (e.g. "cardio vs strength split", "exercise breakdown", "what do I eat"), default to "entries" (session count). It is the most universally populated and intuitive measure of activity.`;

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

    const { messages, period } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const days = typeof period === "number" && [7, 30, 90].includes(period) ? period : 30;

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

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
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

    console.log("generate-chart-dsl result:", JSON.stringify(dsl).slice(0, 1000));

    // Validate required DSL fields
    if (!dsl.source || !dsl.metric || !dsl.groupBy || !dsl.aggregation) {
      return new Response(
        JSON.stringify({ error: "AI returned an incomplete schema. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
