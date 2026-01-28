import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYZE_WEIGHTS_PROMPT = `You are a fitness assistant helping a user log their weight training workouts. Parse natural language workout descriptions and extract structured exercise data.

Analyze the following workout description and extract individual exercises with their set, rep, and weight information.

Workout description: "{{rawInput}}"

For each exercise, provide:
- exercise_key: a canonical snake_case identifier for the exercise (e.g., "lat_pulldown", "bench_press", "squat", "deadlift", "bicep_curl"). Use consistent keys so the same exercise always gets the same key, regardless of how the user describes it.
- description: a user-friendly name for the exercise (e.g., "Lat Pulldown", "Bench Press")
- sets: number of sets performed (integer)
- reps: number of reps per set (integer)
- weight_lbs: weight in pounds (number)

Handle common patterns like:
- "3x10 lat pulldown at 100 lbs" → 3 sets, 10 reps, 100 lbs
- "bench press 4 sets of 8 reps at 135" → 4 sets, 8 reps, 135 lbs
- "3 sets 10 reps squats 225" → 3 sets, 10 reps, 225 lbs

Normalize exercise names to canonical keys:
- "lat pulldowns", "lat pull-down", "pulldowns" → "lat_pulldown"
- "bench", "bench press", "flat bench" → "bench_press"
- "squats", "back squat", "barbell squat" → "squat"
- "curls", "bicep curls", "arm curls" → "bicep_curl"

Default to lbs for weight if no unit is specified.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "exercises": [
    { "exercise_key": "exercise_key", "description": "Exercise Name", "sets": 3, "reps": 10, "weight_lbs": 100 }
  ]
}`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { rawInput } = await req.json();
    if (!rawInput || typeof rawInput !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing rawInput" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enforce input length limit (500 chars for workout descriptions)
    if (rawInput.length > 500) {
      return new Response(
        JSON.stringify({ error: "Input too long (max 500 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the prompt
    const prompt = ANALYZE_WEIGHTS_PROMPT.replace("{{rawInput}}", rawInput);

    console.log(`[analyze-weights] Processing: "${rawInput.substring(0, 100)}..."`);
    const startTime = Date.now();

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a fitness tracking assistant. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("[analyze-weights] AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    const latencyMs = Date.now() - startTime;
    console.log(`[analyze-weights] Completed in ${latencyMs}ms`);

    // Parse JSON response (handle potential markdown wrapping)
    let parsed;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      parsed = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("[analyze-weights] Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate response structure
    if (!parsed.exercises || !Array.isArray(parsed.exercises)) {
      throw new Error("Invalid response structure: missing exercises array");
    }

    // Validate each exercise
    for (const exercise of parsed.exercises) {
      if (!exercise.exercise_key || !exercise.description) {
        throw new Error("Invalid exercise: missing required fields");
      }
      if (typeof exercise.sets !== "number" || typeof exercise.reps !== "number" || typeof exercise.weight_lbs !== "number") {
        throw new Error("Invalid exercise: sets, reps, and weight_lbs must be numbers");
      }
    }

    return new Response(
      JSON.stringify({ exercises: parsed.exercises }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[analyze-weights] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
