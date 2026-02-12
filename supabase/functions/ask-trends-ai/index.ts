import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const userId = claimsData.claims.sub;

    // Parse & validate input
    const { question, mode, includeProfile } = await req.json();

    if (!question || typeof question !== "string" || question.length > 500) {
      return new Response(
        JSON.stringify({ error: "question is required (max 500 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode !== "food" && mode !== "exercise") {
      return new Response(
        JSON.stringify({ error: 'mode must be "food" or "exercise"' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch 90 days of data
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const startDate = ninetyDaysAgo.toISOString().split("T")[0];

    let dataContext = "";

    if (mode === "food") {
      const { data: entries, error: fetchErr } = await supabase
        .from("food_entries")
        .select("eaten_date, food_items, total_calories, total_protein, total_carbs, total_fat")
        .gte("eaten_date", startDate)
        .order("eaten_date", { ascending: true });

      if (fetchErr) throw fetchErr;

      if (!entries || entries.length === 0) {
        dataContext = "No food data available for the last 90 days.";
      } else {
        // Aggregate by day for a compact representation
        const byDate: Record<string, { cal: number; prot: number; carbs: number; fat: number; items: string[] }> = {};
        for (const e of entries) {
          const d = e.eaten_date;
          if (!byDate[d]) byDate[d] = { cal: 0, prot: 0, carbs: 0, fat: 0, items: [] };
          byDate[d].cal += e.total_calories;
          byDate[d].prot += Number(e.total_protein);
          byDate[d].carbs += Number(e.total_carbs);
          byDate[d].fat += Number(e.total_fat);

          // Extract food descriptions
          const items = e.food_items as any[];
          if (Array.isArray(items)) {
            for (const item of items) {
              if (item.description) {
                const desc = item.portion
                  ? `${item.description} (${item.portion})`
                  : item.description;
                byDate[d].items.push(desc);
              }
            }
          }
        }

        const lines = Object.entries(byDate).map(([date, v]) => {
          const itemsSummary = v.items.length > 0 ? ` | Foods: ${v.items.join(", ")}` : "";
          return `${date}: ${Math.round(v.cal)} cal, ${Math.round(v.prot)}g protein, ${Math.round(v.carbs)}g carbs, ${Math.round(v.fat)}g fat${itemsSummary}`;
        });
        dataContext = `Food log (last 90 days, ${Object.keys(byDate).length} days with data):\n${lines.join("\n")}`;
      }
    } else {
      // Exercise mode
      const { data: sets, error: fetchErr } = await supabase
        .from("weight_sets")
        .select("logged_date, exercise_key, exercise_subtype, description, sets, reps, weight_lbs, duration_minutes, distance_miles, exercise_metadata")
        .gte("logged_date", startDate)
        .order("logged_date", { ascending: true });

      if (fetchErr) throw fetchErr;

      if (!sets || sets.length === 0) {
        dataContext = "No exercise data available for the last 90 days.";
      } else {
        const lines = sets.map((s: any) => {
          const parts = [`${s.logged_date}: ${s.description}`];
          if (s.sets > 0 && s.reps > 0) parts.push(`${s.sets}x${s.reps}`);
          if (s.weight_lbs > 0) parts.push(`${s.weight_lbs} lbs`);
          if (s.duration_minutes) parts.push(`${s.duration_minutes} min`);
          if (s.distance_miles) parts.push(`${s.distance_miles} mi`);
          const meta = s.exercise_metadata as Record<string, any> | null;
          if (meta) {
            if (meta.effort) parts.push(`effort: ${meta.effort}/10`);
            if (meta.calories_burned) parts.push(`reported: ${meta.calories_burned} cal`);
          }
          return parts.join(", ");
        });
        dataContext = `Exercise log (last 90 days, ${sets.length} entries):\n${lines.join("\n")}`;
      }
    }

    // Fetch profile if requested
    let profileContext = "";
    if (includeProfile) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("settings")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.settings) {
        const s = profile.settings as any;
        const parts: string[] = [];
        if (s.bodyWeightLbs) parts.push(`Body weight: ${s.bodyWeightLbs} lbs`);
        if (s.heightInches) {
          const feet = Math.floor(s.heightInches / 12);
          const inches = Math.round(s.heightInches % 12);
          parts.push(`Height: ${feet}'${inches}"`);
        }
        if (s.age) parts.push(`Age: ${s.age}`);
        if (s.bodyComposition) parts.push(`Body composition: ${s.bodyComposition}`);
        if (parts.length > 0) {
          profileContext = `\n\nUser profile: ${parts.join(", ")}`;
        }
      }
    }

    const modeLabel = mode === "food" ? "nutrition" : "fitness/exercise";
    const systemPrompt = `You are a concise ${modeLabel} analyst. The user will ask a question about their ${mode} data. Answer based on the data provided. Use plain, everyday language — avoid gym jargon and technical fitness terminology. Summarize trends and patterns at a high level — avoid listing individual dates or day-by-day examples. Use ranges and generalizations (e.g. "over the past month", "consistently around X") instead of citing specific dates. Use bullet points when making multiple observations. Keep answers to 2-3 short paragraphs max. Do not give medical advice — suggest consulting a professional for medical questions. If the data is insufficient to answer, say so.`;

    const userPrompt = `${dataContext}${profileContext}\n\nQuestion: ${question}`;

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
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
    const answer = aiData.choices?.[0]?.message?.content || "No response from AI.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("ask-trends-ai error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
