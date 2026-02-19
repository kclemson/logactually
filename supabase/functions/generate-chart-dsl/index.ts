import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a semantic parser for a health and fitness tracking app. The user will describe a chart they want to see. Your job is to interpret their intent and return a declarative chart schema (DSL). You do NOT compute any data — the client will execute the schema against its own database.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences). The JSON object must conform to this schema:

{
  "chartType": "bar" | "line" | "area",
  "title": "Chart title",

  "source": "food" | "exercise",
  "metric": "<metric key>",
  "derivedMetric": "<derived metric key or null>",

  "groupBy": "date" | "dayOfWeek" | "hourOfDay" | "weekdayVsWeekend" | "week",
  "aggregation": "sum" | "average" | "max" | "min" | "count",

  "filter": {
    "exerciseKey": "<exercise key or null>",
    "dayOfWeek": [0-6] or null
  } or null,

  "compare": {
    "metric": "<metric key>",
    "source": "food" | "exercise"
  } or null,

  "sort": "label" | "value_asc" | "value_desc" or null
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
  - exercise_key (text): canonical snake_case identifier (e.g. "bench_press", "walk_run", "cycling")
  - description (text): human-friendly exercise name
  - exercise_subtype (text, nullable): e.g. "running", "walking", "indoor"
  - sets (int), reps (int), weight_lbs (numeric)
  - duration_minutes (numeric, nullable), distance_miles (numeric, nullable)
  - exercise_metadata (jsonb, nullable): { heart_rate, effort, calories_burned, cadence_rpm, speed_mph, incline_pct }

AVAILABLE METRICS:
- Food source: cal, protein, carbs, fat, fiber, sugar, sat_fat, sodium, chol, entries
- Exercise source: sets, duration, distance, cal_burned, unique_exercises

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

FILTER OPTIONS:
- exerciseKey: filter exercise data to a specific exercise_key (e.g. "bench_press")
- dayOfWeek: array of day numbers (0=Sun, 1=Mon, ..., 6=Sat) to include

AGGREGATION SEMANTICS:

When groupBy is "date" or "week" (time-series), each bucket represents a single
time period. "sum" answers "how much total that day/week", "average" answers
"average per entry that day/week".

When groupBy is categorical ("dayOfWeek", "hourOfDay", "weekdayVsWeekend"),
each bucket pools data from MANY instances across the query period. The user
almost always wants to compare a TYPICAL bucket, not a volume total that's
biased by how many times that bucket appears in the period. Default to "average"
for categorical groupings unless the user explicitly asks for totals.

"count" answers "how many days/entries had data" — use when the user asks
about frequency, not magnitude.

CHART TYPE SELECTION:

- "line" or "area" for time-series groupings (date, week) — shows trends over time
- "bar" for categorical groupings (dayOfWeek, hourOfDay, weekdayVsWeekend) — shows comparison across buckets
- When in doubt, prefer "bar" for categorical and "line" for temporal

SORTING:

- For categorical bar charts, consider sort=value_desc to rank buckets
- Never sort time-series charts (date, week) — they must stay chronological

GENERAL:

- title should be concise and descriptive
- Do NOT include any data values — only the schema`;

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
