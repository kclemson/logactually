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
- Exercise log: dates, exercise names, sets, reps, weight (lbs), duration (minutes), distance (miles), and metadata including heart rate, effort level, and reported calories burned
- Custom log entries: dates, numeric values, text values, and units

Your job:
1. Determine the right aggregation and grouping for the user's request
2. Compute the data from the raw logs provided
3. Return a chart specification using the generate_chart tool

Rules:
- The data array must contain the actual computed values, not raw log entries
- Each item in the data array must have a value for the xAxis field and the dataKey field
- Use short, readable labels for the x-axis (e.g., "6am", "Mon", "Jan 5")
- Choose a color hex code that fits the data type (blue shades for calories, green for protein, teal for custom logs, purple for exercise)
- For time-of-day analysis, use the created_at timestamps, not the date fields
- Preserve numeric precision as appropriate: use 1 decimal place for weights and averages, whole numbers for counts and calories, mm:ss format description for durations in the title/subtitle
- When the user asks to modify the previous chart, change only what they asked for. Keep everything else the same.
- If the data is insufficient for the request, still return the best chart you can and explain any limitations or assumptions in the aiNote field`;

const TOOL_DEFINITION = {
  type: "function",
  function: {
    name: "generate_chart",
    description: "Generate a chart specification from the user's data",
    parameters: {
      type: "object",
      properties: {
        chartType: { type: "string", enum: ["bar", "line"] },
        title: { type: "string" },
        subtitle: { type: "string" },
        aiNote: {
          type: "string",
          description: "Brief explanation of methodology, assumptions, or data limitations",
        },
        xAxisField: { type: "string", description: "Field name in each data item for x-axis labels" },
        xAxisLabel: { type: "string" },
        yAxisLabel: { type: "string" },
        dataKey: { type: "string", description: "Field name in each data item for the plotted numeric value" },
        color: { type: "string", description: "Hex color code, e.g. #2563EB" },
        data: {
          type: "array",
          description: "Array of data points. Each object MUST contain a key matching xAxisField (the label) and a key matching dataKey (the numeric value). Example: if xAxisField='time' and dataKey='avg_cal', each item must be like {\"time\": \"6am\", \"avg_cal\": 120}.",
          items: { type: "object", additionalProperties: true },
        },
        valueFormat: {
          type: "string",
          enum: ["integer", "decimal1", "duration_mmss", "none"],
          description: "How to format numeric labels on the chart",
        },
        referenceLineValue: { type: "number" },
        referenceLineLabel: { type: "string" },
      },
      required: [
        "chartType",
        "title",
        "xAxisField",
        "xAxisLabel",
        "yAxisLabel",
        "dataKey",
        "color",
        "data",
      ],
    },
  },
};

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

    const dataContext = [foodContext, exerciseContext, customContext].filter(Boolean).join("\n\n");

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
        tools: [TOOL_DEFINITION],
        tool_choice: { type: "function", function: { name: "generate_chart" } },
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

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_chart") {
      console.error("Unexpected AI response:", JSON.stringify(aiData));
      throw new Error("AI did not return a chart specification");
    }

    let args: any;
    try {
      args = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch {
      console.error("Failed to parse tool args:", toolCall.function.arguments);
      throw new Error("AI returned invalid chart data");
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
      referenceLine: args.referenceLineValue != null
        ? { value: args.referenceLineValue, label: args.referenceLineLabel }
        : undefined,
    };

    return new Response(JSON.stringify({ chartSpec }), {
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
