import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a data visualization assistant for a health and fitness tracking app. The user will describe a chart they want to see based on their logged data.

You have access to:
- Food log: timestamps (created_at), calories, protein, carbs, fat, fiber, sugar, saturated fat, sodium, cholesterol, item descriptions, and portions
- Exercise log: covers all types of physical activity -- strength training, cardio, sports, and everyday activities (e.g. walking, gardening). Fields: dates, exercise names, sets, reps, weight (lbs), duration (minutes), distance (miles), and metadata including heart rate, effort level, and reported calories burned. Not every exercise uses every field; cardio entries typically have duration/distance but no sets/reps/weight
- Custom log entries: dates, numeric values, text values, and units

Your job:
1. Determine the right aggregation and grouping for the user's request
2. Compute the data from the raw logs provided
3. Return a JSON chart specification

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no explanation outside the JSON). The JSON object must have this structure:

{
  "chartType": "bar" or "line",
  "title": "Chart title",
  "subtitle": "Optional subtitle or null",
  "aiNote": "Optional methodology note or null",
  "dataSource": "food" or "exercise" or "custom" or "mixed",
  "xAxisField": "the key name used in each data item for x-axis labels",
  "xAxisLabel": "X axis display label",
  "yAxisLabel": "Y axis display label",
  "dataKey": "the key name used in each data item for the numeric value",
  "color": "#2563EB",
  "data": [
    {"rawDate": "2025-02-12", "date": "Feb 12", "calories": 1850},
    {"rawDate": "2025-02-13", "date": "Feb 13", "calories": 2100}
  ],
  "valueFormat": "integer" or "decimal1" or "duration_mmss" or null
}

In the example above, xAxisField="date" and dataKey="calories". Your actual field names will vary.

CRITICAL: The "data" array MUST contain fully populated objects with real computed values. Each object MUST have a key matching xAxisField (string label) and a key matching dataKey (number). Every object in "data" MUST include a "rawDate" field containing the date in "yyyy-MM-dd" format (e.g. "2025-02-12"). NEVER return empty objects.

"dataSource" indicates which log the chart primarily uses: "food" for food/nutrition data, "exercise" for exercise/weight data, "custom" for custom log data, or "mixed" if combining multiple sources.

AGGREGATION MODES — choose the right one based on what the user is asking:

1. TIME-SERIES (default): One data point per date. Use when the user asks about trends "over time", "per day", "last N days", etc. The x-axis shows calendar dates.

2. CATEGORICAL: One data point per category bucket, aggregated across the entire period. Use when the user asks to group "by" a non-date dimension. The x-axis shows category labels, NOT dates. The data array must have exactly one entry per bucket.

For categorical charts, set rawDate to the most recent date that contributed data to that bucket.

Common categorical patterns:
- "by hour of day" → 24 buckets max, labeled "12am"–"11pm", aggregate using created_at timestamps
- "by day of week" → 7 buckets, ordered by weekday name

COMPARING GROUPS (e.g. "workout days vs rest days"):
- The result is categorical with one bucket per group
- Always explain in aiNote exactly how you defined each group
- Use only the data provided to determine group membership

DATA INTEGRITY:
- DAILY TOTALS sections are pre-computed and authoritative. For any query involving daily calorie/macro/exercise totals, use these values directly. Do NOT attempt to re-sum individual items for daily aggregation.
- Never fabricate or interpolate values. Only return values directly computable from the provided logs.
- If a bucket has no data, omit it or use zero. Do not invent values.
- All numeric values in the data array must be non-negative.

Rules:
- Use short, readable labels for the x-axis (e.g., "6am", "Mon", "Jan 5")
- Use these exact colors when the chart's primary metric matches: calories "#2563EB", protein "#115E83", carbs "#00B4D8", fat "#90E0EF", exercise/training "#7C3AED". For anything else, choose a reasonable color hex code.
- For time-of-day analysis, use created_at timestamps, not date fields
- Preserve numeric precision: 1 decimal for averages, whole numbers for counts/calories
- When modifying a previous chart, change only what was asked
- If data is insufficient, return the best chart you can and explain in aiNote

VERIFICATION METADATA — you MUST include a "verification" field in your JSON response so the client can cross-check your computed values against known daily totals.

"verification" must be one of:

1. An object with "type": "daily" — use when each data point corresponds to exactly one date's total.
   Required fields: "source" ("food" or "exercise"), "field" (the exact key name in daily totals).
   Example: {"type": "daily", "source": "food", "field": "cal"}
   The client will look up dailyTotals[source][rawDate][field] for each data point.

2. An object with "type": "aggregate" — use when data points aggregate across multiple dates (e.g. "workout vs rest days", "by day of week", "weekdays vs weekends").
   Required fields: "source", "field", "method" ("sum", "average", "count", "max", or "min"), "breakdown" (array of {label, dates}).
   Each breakdown entry's "label" must exactly match the corresponding data point's xAxisField value.
   Each "dates" array lists every yyyy-MM-dd date that contributed to that bucket.
   Example: {"type": "aggregate", "source": "food", "field": "cal", "method": "average", "breakdown": [{"label": "Workout Days", "dates": ["2026-02-01", "2026-02-03"]}, {"label": "Rest Days", "dates": ["2026-02-02", "2026-02-04"]}]}

3. null — use when the chart's values cannot be verified against daily totals (ratios, percentages, counts of distinct items, multi-field derived metrics).

Field names must exactly match daily totals keys:
- Food: cal, protein, carbs, fat, fiber, sugar, sat_fat, sodium, chol, entries (entries = number of food log entries/meals for that date)
- Exercise: sets, duration, distance, cal_burned, unique_exercises`;

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
      { global: { headers: { Authorization: authHeader } } }
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
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const days = typeof period === "number" && [7, 30, 90].includes(period) ? period : 30;

    // Fetch data for the period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    const [foodResult, exerciseResult, customLogResult, customTypeResult] = await Promise.all([
      supabase
        .from("food_entries")
        .select("eaten_date, food_items, total_calories, total_protein, total_carbs, total_fat, created_at")
        .gte("eaten_date", startDateStr)
        .order("eaten_date", { ascending: true }),
      supabase
        .from("weight_sets")
        .select("logged_date, exercise_key, exercise_subtype, description, sets, reps, weight_lbs, duration_minutes, distance_miles, exercise_metadata, created_at")
        .gte("logged_date", startDateStr)
        .order("logged_date", { ascending: true }),
      supabase
        .from("custom_log_entries")
        .select("logged_date, log_type_id, numeric_value, numeric_value_2, text_value, unit")
        .gte("logged_date", startDateStr)
        .order("logged_date", { ascending: true }),
      supabase
        .from("custom_log_types")
        .select("id, name, value_type, unit"),
    ]);

    if (foodResult.error) throw foodResult.error;
    if (exerciseResult.error) throw exerciseResult.error;

    // Build food context with ALL item-level data
    let foodContext = "";
    const foodEntries = foodResult.data || [];
    if (foodEntries.length === 0) {
      foodContext = "No food data for this period.";
    } else {
      const lines: string[] = [];
      for (const e of foodEntries) {
        const items = e.food_items as any[];
        if (Array.isArray(items)) {
          for (const item of items) {
            const parts = [
              `date=${e.eaten_date}`,
              `created_at=${e.created_at}`,
              `desc="${item.description || "unknown"}"`,
            ];
            if (item.portion) parts.push(`portion="${item.portion}"`);
            if (item.calories != null) parts.push(`cal=${item.calories}`);
            if (item.protein != null) parts.push(`protein=${item.protein}`);
            if (item.carbs != null) parts.push(`carbs=${item.carbs}`);
            if (item.fat != null) parts.push(`fat=${item.fat}`);
            if (item.fiber != null) parts.push(`fiber=${item.fiber}`);
            if (item.sugar != null) parts.push(`sugar=${item.sugar}`);
            if (item.saturated_fat != null) parts.push(`sat_fat=${item.saturated_fat}`);
            if (item.sodium != null) parts.push(`sodium=${item.sodium}mg`);
            if (item.cholesterol != null) parts.push(`chol=${item.cholesterol}mg`);
            lines.push(parts.join(", "));
          }
        }
      }
      foodContext = `Food items (${lines.length} items over ${days} days):\n${lines.join("\n")}`;
    }

    // Pre-aggregate daily food totals
    let foodDailySummary = "";
    const dailyFoodTotals = new Map<string, { cal: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sat_fat: number; sodium: number; chol: number; entries: number }>();
    for (const e of foodEntries) {
      const items = e.food_items as any[];
      if (!Array.isArray(items)) continue;
      const t = dailyFoodTotals.get(e.eaten_date) || { cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sat_fat: 0, sodium: 0, chol: 0, entries: 0 };
      t.entries += 1;
      for (const item of items) {
        t.cal += item.calories || 0;
        t.protein += item.protein || 0;
        t.carbs += item.carbs || 0;
        t.fat += item.fat || 0;
        t.fiber += item.fiber || 0;
        t.sugar += item.sugar || 0;
        t.sat_fat += item.saturated_fat || 0;
        t.sodium += item.sodium || 0;
        t.chol += item.cholesterol || 0;
      }
      dailyFoodTotals.set(e.eaten_date, t);
    }
    if (dailyFoodTotals.size > 0) {
      const lines: string[] = [];
      for (const [date, t] of [...dailyFoodTotals.entries()].sort()) {
        lines.push(`${date}: cal=${Math.round(t.cal)}, protein=${Math.round(t.protein)}, carbs=${Math.round(t.carbs)}, fat=${Math.round(t.fat)}, fiber=${Math.round(t.fiber)}, sugar=${Math.round(t.sugar)}, sat_fat=${Math.round(t.sat_fat)}, sodium=${Math.round(t.sodium)}, chol=${Math.round(t.chol)}, entries=${t.entries}`);
      }
      foodDailySummary = `Daily food totals (pre-computed, authoritative):\n${lines.join("\n")}`;
    }

    // Build exercise context
    let exerciseContext = "";
    const exerciseSets = exerciseResult.data || [];
    if (exerciseSets.length === 0) {
      exerciseContext = "No exercise data for this period.";
    } else {
      const lines = exerciseSets.map((s: any) => {
      const parts = [`date=${s.logged_date}`, `key=${s.exercise_key}`, `name="${s.description}"`];
      if (s.exercise_subtype) parts.push(`subtype=${s.exercise_subtype}`);
        if (s.sets > 0 && s.reps > 0) parts.push(`${s.sets}x${s.reps}`);
        if (s.weight_lbs > 0) parts.push(`${s.weight_lbs}lbs`);
        if (s.duration_minutes) parts.push(`${s.duration_minutes}min`);
        if (s.distance_miles) parts.push(`${s.distance_miles}mi`);
        const meta = s.exercise_metadata as Record<string, any> | null;
        if (meta) {
          if (meta.heart_rate) parts.push(`hr=${meta.heart_rate}`);
          if (meta.effort) parts.push(`effort=${meta.effort}/10`);
          if (meta.calories_burned) parts.push(`cal_burned=${meta.calories_burned}`);
          if (meta.cadence_rpm) parts.push(`cadence=${meta.cadence_rpm}`);
          if (meta.speed_mph) parts.push(`speed=${meta.speed_mph}mph`);
        }
        parts.push(`created_at=${s.created_at}`);
        return parts.join(", ");
      });
      exerciseContext = `Exercise log (${exerciseSets.length} sets over ${days} days):\n${lines.join("\n")}`;
    }

    // Pre-aggregate daily exercise totals
    let exerciseDailySummary = "";
    const dailyExTotals = new Map<string, { sets: number; duration: number; distance: number; cal_burned: number; exercises: Set<string> }>();
    for (const s of exerciseSets) {
      const t = dailyExTotals.get(s.logged_date) || { sets: 0, duration: 0, distance: 0, cal_burned: 0, exercises: new Set<string>() };
      t.sets += 1;
      t.duration += s.duration_minutes || 0;
      t.distance += s.distance_miles || 0;
      const meta = s.exercise_metadata as any;
      t.cal_burned += meta?.calories_burned || 0;
      t.exercises.add(s.exercise_key);
      dailyExTotals.set(s.logged_date, t);
    }
    if (dailyExTotals.size > 0) {
      const lines: string[] = [];
      for (const [date, t] of [...dailyExTotals.entries()].sort()) {
        lines.push(`${date}: logged_sets=${t.sets}, duration_min=${Math.round(t.duration)}, distance_mi=${Math.round(t.distance * 10) / 10}, cal_burned=${Math.round(t.cal_burned)}, unique_exercises=${t.exercises.size}`);
      }
      exerciseDailySummary = `Daily exercise totals (pre-computed, authoritative):\n${lines.join("\n")}`;
    }

    // Per-exercise-key aggregates for categorical verification
    const exerciseByKey = new Map<string, {
      description: string;
      count: number;
      total_sets: number;
      total_reps: number;
      total_duration: number;
      total_distance: number;
      total_cal_burned: number;
      heart_rates: number[];
      efforts: number[];
    }>();

    for (const s of exerciseSets) {
      const key = s.exercise_key;
      const existing = exerciseByKey.get(key) || {
        description: s.description,
        count: 0, total_sets: 0, total_reps: 0,
        total_duration: 0, total_distance: 0,
        total_cal_burned: 0, heart_rates: [], efforts: [],
      };
      existing.count++;
      existing.total_sets += s.sets || 0;
      existing.total_reps += (s.sets || 0) * (s.reps || 0);
      existing.total_duration += s.duration_minutes || 0;
      existing.total_distance += s.distance_miles || 0;
      const meta = s.exercise_metadata as any;
      if (meta?.heart_rate) existing.heart_rates.push(meta.heart_rate);
      if (meta?.effort) existing.efforts.push(meta.effort);
      existing.total_cal_burned += meta?.calories_burned || 0;
      exerciseByKey.set(key, existing);
    }

    // Build custom log context
    let customContext = "";
    const customEntries = customLogResult.data || [];
    const customTypes = customTypeResult.data || [];
    if (customEntries.length > 0) {
      const typeMap = new Map(customTypes.map((t: any) => [t.id, t]));
      const lines = customEntries.map((e: any) => {
        const type = typeMap.get(e.log_type_id);
        const parts = [`date=${e.logged_date}`, `type="${type?.name || "unknown"}"`];
        if (e.numeric_value != null) parts.push(`value=${e.numeric_value}`);
        if (e.numeric_value_2 != null) parts.push(`value2=${e.numeric_value_2}`);
        if (e.text_value) parts.push(`text="${e.text_value}"`);
        if (e.unit || type?.unit) parts.push(`unit=${e.unit || type?.unit}`);
        return parts.join(", ");
      });
      customContext = `Custom logs (${customEntries.length} entries):\n${lines.join("\n")}`;
    }

    const dataContext = [foodDailySummary, foodContext, exerciseDailySummary, exerciseContext, customContext].filter(Boolean).join("\n\n");

    // Build AI messages
    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here is the user's data for the last ${days} days:\n\n${dataContext}\n\n---\n\nConversation:`,
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
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // Extract JSON from the response content
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      console.error("Unexpected AI response:", JSON.stringify(aiData).slice(0, 2000));
      throw new Error("AI did not return content");
    }

    let args: any;
    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      args = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI JSON:", content.slice(0, 2000));
      throw new Error("AI returned invalid JSON");
    }

    console.log("generate_chart args:", JSON.stringify(args).slice(0, 2000));

    // Validate and filter data items
    const rawData = Array.isArray(args.data) ? args.data : [];
    const validData = rawData.filter((d: any) =>
      d && Object.keys(d).length > 0 && d[args.xAxisField] !== undefined && d[args.dataKey] !== undefined
    );
    if (validData.length < rawData.length) {
      console.warn(`Filtered ${rawData.length - validData.length} empty/invalid data items out of ${rawData.length}`);
    }
    if (validData.length === 0) {
      return new Response(
        JSON.stringify({ error: "The AI generated a chart structure but produced no valid data points. Please try rephrasing your request." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map to ChartSpec
    const chartSpec = {
      chartType: args.chartType,
      title: args.title,
      subtitle: args.subtitle || undefined,
      aiNote: args.aiNote || undefined,
      xAxis: { field: args.xAxisField, label: args.xAxisLabel },
      yAxis: { label: args.yAxisLabel },
      color: args.color,
      data: validData,
      dataKey: args.dataKey,
      valueFormat: args.valueFormat || undefined,
      dataSource: ["food", "exercise", "custom", "mixed"].includes(args.dataSource) ? args.dataSource : undefined,
      referenceLine: args.referenceLineValue != null
        ? { value: args.referenceLineValue, label: args.referenceLineLabel }
        : undefined,
      verification: args.verification !== undefined ? args.verification : undefined,
    };

    // Serialize dailyTotals for client-side verification
    const serializedFoodTotals: Record<string, any> = {};
    for (const [date, t] of dailyFoodTotals.entries()) {
      serializedFoodTotals[date] = { cal: Math.round(t.cal), protein: Math.round(t.protein), carbs: Math.round(t.carbs), fat: Math.round(t.fat), fiber: Math.round(t.fiber), sugar: Math.round(t.sugar), sat_fat: Math.round(t.sat_fat), sodium: Math.round(t.sodium), chol: Math.round(t.chol), entries: t.entries };
    }
    const serializedExTotals: Record<string, any> = {};
    for (const [date, t] of dailyExTotals.entries()) {
      serializedExTotals[date] = { sets: t.sets, duration: Math.round(t.duration), distance: Math.round(t.distance * 10) / 10, cal_burned: Math.round(t.cal_burned), unique_exercises: t.exercises.size };
    }

    const serializedExByKey: Record<string, any> = {};
    for (const [key, t] of exerciseByKey.entries()) {
      serializedExByKey[key] = {
        description: t.description,
        count: t.count,
        total_sets: t.total_sets,
        total_duration: Math.round(t.total_duration),
        avg_duration: t.count > 0 ? Math.round(t.total_duration / t.count * 10) / 10 : 0,
        total_distance: Math.round(t.total_distance * 10) / 10,
        avg_heart_rate: t.heart_rates.length > 0
          ? Math.round(t.heart_rates.reduce((a, b) => a + b, 0) / t.heart_rates.length)
          : null,
        avg_effort: t.efforts.length > 0
          ? Math.round(t.efforts.reduce((a, b) => a + b, 0) / t.efforts.length * 10) / 10
          : null,
        total_cal_burned: Math.round(t.total_cal_burned),
      };
    }

    return new Response(JSON.stringify({
      chartSpec,
      dailyTotals: { food: serializedFoodTotals, exercise: serializedExTotals, exerciseByKey: serializedExByKey },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("generate-chart error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
