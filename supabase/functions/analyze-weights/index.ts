import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getWeightExerciseReferenceForPrompt, getCardioExerciseReferenceForPrompt } from "../_shared/exercises.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYZE_WEIGHTS_PROMPT = `You are a fitness assistant helping a user log their workouts. Parse natural language workout descriptions and extract structured exercise data.

Analyze the following workout description and extract individual exercises with their set, rep, and weight information.

Workout description: "{{rawInput}}"

## WEIGHT EXERCISES

For weight exercises, provide:
- exercise_key: a canonical snake_case identifier. PREFER using keys from the reference list below when the user's input matches. You may create new keys for exercises not in the list.
- description: a user-friendly name for the exercise (e.g., "Lat Pulldown", "Bench Press")
- sets: number of sets performed (integer)
- reps: number of reps per set (integer)
- weight_lbs: weight in pounds (number)

CANONICAL WEIGHT EXERCISES (prefer these keys when applicable):
{{weightExerciseReference}}

Handle common patterns like:
- "3x10 lat pulldown at 100 lbs" → 3 sets, 10 reps, 100 lbs
- "bench press 4 sets of 8 reps at 135" → 4 sets, 8 reps, 135 lbs
- "3 sets 10 reps squats 225" → 3 sets, 10 reps, 225 lbs
- "the machine where you pull the bar down to your chest" → lat_pulldown
- "leg pushing machine where you sit at an angle" → leg_press

Default to lbs for weight if no unit is specified.

## CARDIO / DURATION EXERCISES

For cardio or duration-based exercises, provide:
- exercise_key: a canonical snake_case identifier from the reference below
- description: a user-friendly, context-specific name (e.g., "Treadmill Jog", "Morning Walk", "5K Run", "Spin Class")
- duration_minutes: duration in minutes (number), if relevant
- distance_miles: distance in miles (number), if relevant. Convert km to miles (1km = 0.621mi).

CANONICAL CARDIO EXERCISES (prefer these keys when applicable):
{{cardioExerciseReference}}

## RESPONSE FORMAT

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "exercises": [
    { "exercise_key": "bench_press", "description": "Bench Press", "sets": 3, "reps": 10, "weight_lbs": 135 },
    { "exercise_key": "walk_run", "description": "Treadmill Walk", "duration_minutes": 30 },
    { "exercise_key": "walk_run", "description": "5K Run", "duration_minutes": 25, "distance_miles": 3.1 }
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
    const prompt = ANALYZE_WEIGHTS_PROMPT
      .replace("{{rawInput}}", rawInput)
      .replace("{{weightExerciseReference}}", getWeightExerciseReferenceForPrompt())
      .replace("{{cardioExerciseReference}}", getCardioExerciseReferenceForPrompt());

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

    // Normalize and validate each exercise (Postel's Law: be liberal in what you accept)
    const normalizedExercises = [];
    for (const exercise of parsed.exercises) {
      if (!exercise.exercise_key || !exercise.description) {
        console.error("[analyze-weights] Invalid exercise missing fields:", exercise);
        throw new Error("Invalid exercise: missing required fields");
      }
      
      // Lenient coercion - accept nulls, undefined, strings, coerce to 0
      const sets = Number(exercise.sets) || 0;
      const reps = Number(exercise.reps) || 0;
      const weight_lbs = Number(exercise.weight_lbs) || 0;
      const duration_minutes = Number(exercise.duration_minutes) || 0;
      const distance_miles = Number(exercise.distance_miles) || 0;
      
      // Valid if EITHER weight data OR cardio data present
      const hasWeightData = sets > 0 && reps > 0;
      const hasCardioData = duration_minutes > 0 || distance_miles > 0;
      
      if (!hasWeightData && !hasCardioData) {
        console.error("[analyze-weights] Exercise has neither weight nor cardio data:", exercise);
        throw new Error("Could not understand exercise. Include sets/reps/weight or duration/distance.");
      }
      
      normalizedExercises.push({
        exercise_key: String(exercise.exercise_key),
        description: String(exercise.description),
        sets: Math.round(sets),
        reps: Math.round(reps),
        weight_lbs: Math.round(weight_lbs * 10) / 10, // Round to 1 decimal
        duration_minutes: hasCardioData && duration_minutes > 0 ? Math.round(duration_minutes * 100) / 100 : null,
        distance_miles: hasCardioData && distance_miles > 0 ? Math.round(distance_miles * 100) / 100 : null,
      });
    }

    return new Response(
      JSON.stringify({ exercises: normalizedExercises }),
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
