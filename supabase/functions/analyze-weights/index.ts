import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getWeightExerciseReferenceForPrompt, getCardioExerciseReferenceForPrompt } from "../_shared/exercises.ts";
import { getAnalyzeWeightsPrompt, interpolateWeightsPrompt, type PromptVersion } from "../_shared/prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allowlisted exercise_metadata keys with validation
const METADATA_ALLOWLIST = ['incline_pct', 'effort', 'calories_burned'] as const;

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
    const { rawInput, promptVersion } = await req.json();
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

    // Build the prompt using versioned templates
    const version: PromptVersion = promptVersion === 'experimental' ? 'experimental' : 'default';
    const template = getAnalyzeWeightsPrompt(version);
    const prompt = interpolateWeightsPrompt(
      template,
      rawInput,
      getWeightExerciseReferenceForPrompt(),
      getCardioExerciseReferenceForPrompt(),
    );

    console.log(`[analyze-weights] Processing (${version}): "${rawInput.substring(0, 100)}..."`);
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
      let sets = Number(exercise.sets) || 0;
      let reps = Number(exercise.reps) || 0;
      const weight_lbs = Number(exercise.weight_lbs) || 0;
      const duration_minutes = Number(exercise.duration_minutes) || 0;
      const distance_miles = Number(exercise.distance_miles) || 0;
      
      // Default missing sets/reps for weight exercises
      if (weight_lbs > 0 || sets > 0 || reps > 0) {
        if (sets === 0) sets = 1;
        if (reps === 0) reps = 10;
      }
      
      // Valid if EITHER weight data OR cardio data present
      const hasWeightData = sets > 0 && reps > 0;
      const hasCardioData = duration_minutes > 0 || distance_miles > 0;
      
      if (!hasWeightData && !hasCardioData) {
        const knownCardioKeys = ['walk_run', 'cycling', 'elliptical', 'rowing', 'stair_climber', 'swimming', 'jump_rope'];
        if (!knownCardioKeys.includes(String(exercise.exercise_key))) {
          console.error("[analyze-weights] Exercise has neither weight nor cardio data:", exercise);
          throw new Error("Could not understand exercise. Include sets/reps/weight or duration/distance.");
        }
      }

      // Validate and sanitize exercise_metadata
      let exercise_metadata: Record<string, number> | null = null;
      if (exercise.exercise_metadata && typeof exercise.exercise_metadata === 'object' && !Array.isArray(exercise.exercise_metadata)) {
        const cleaned: Record<string, number> = {};
        for (const key of METADATA_ALLOWLIST) {
          const val = Number(exercise.exercise_metadata[key]);
          if (val > 0 && isFinite(val)) {
            if (key === 'effort') {
              cleaned[key] = Math.min(10, Math.max(1, Math.round(val)));
            } else {
              cleaned[key] = Math.round(val * 10) / 10;
            }
          }
        }
        if (Object.keys(cleaned).length > 0) {
          exercise_metadata = cleaned;
        }
      }
      
      normalizedExercises.push({
        exercise_key: String(exercise.exercise_key),
        exercise_subtype: exercise.exercise_subtype ? String(exercise.exercise_subtype) : null,
        description: String(exercise.description),
        sets: Math.round(sets),
        reps: Math.round(reps),
        weight_lbs: Math.round(weight_lbs * 10) / 10,
        duration_minutes: hasCardioData && duration_minutes > 0 ? Math.round(duration_minutes * 100) / 100 : null,
        distance_miles: hasCardioData && distance_miles > 0 ? Math.round(distance_miles * 100) / 100 : null,
        exercise_metadata,
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
