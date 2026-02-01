import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAnalyzeFoodPrompt, interpolatePrompt, type PromptVersion } from "../_shared/prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Internal interface for parsing AI response (keeps name and portion separate)
interface ParsedFoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  sugar: number;
  fat: number;
  saturated_fat: number;
  sodium: number;
  cholesterol: number;
  confidence?: 'high' | 'medium' | 'low';
  source_note?: string;
}

// Output interface sent to client (merged description)
interface FoodItem {
  description: string;
  portion?: string;
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  net_carbs: number;
  sugar: number;
  fat: number;
  saturated_fat: number;
  sodium: number;
  cholesterol: number;
  confidence?: 'high' | 'medium' | 'low';
  source_note?: string;
}

interface AnalyzeResponse {
  food_items: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fiber: number;
  total_net_carbs: number;
  total_sugar: number;
  total_fat: number;
  total_saturated_fat: number;
  total_sodium: number;
  total_cholesterol: number;
}


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth validation failed:', claimsError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    const { rawInput, additionalContext, promptVersion } = await req.json();

    if (!rawInput || typeof rawInput !== 'string') {
      return new Response(
        JSON.stringify({ error: 'rawInput is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate promptVersion if provided
    const version: PromptVersion = promptVersion === 'experimental' ? 'experimental' : 'default';

    console.log('Analyzing food input:', rawInput);
    console.log('Prompt version:', version);
    if (additionalContext) {
      console.log('Additional context:', additionalContext);
    }

    // Get prompt template and interpolate values
    const promptTemplate = getAnalyzeFoodPrompt(version);
    const prompt = interpolatePrompt(promptTemplate, rawInput, additionalContext);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze food', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response:', data);
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response content:', content);

    // Parse the JSON response
    let parsed: { food_items: ParsedFoodItem[] };
    try {
      // Remove any potential markdown code blocks and extract JSON
      let cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      // Find the first '{' and last '}' to extract just the JSON object
      const jsonStart = cleanContent.indexOf('{');
      const jsonEnd = cleanContent.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
      }
      
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Content:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', raw: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send name and portion as separate fields for UI styling
    const mergedItems: FoodItem[] = parsed.food_items.map(item => {
      const fiber = item.fiber || 0;
      const carbs = item.carbs || 0;
      return {
        description: item.name,
        portion: item.portion || undefined,
        calories: item.calories || 0,
        protein: item.protein || 0,
        carbs: carbs,
        fiber: fiber,
        net_carbs: Math.max(0, carbs - fiber),
        sugar: item.sugar || 0,
        fat: item.fat || 0,
        saturated_fat: item.saturated_fat || 0,
        sodium: item.sodium || 0,
        cholesterol: item.cholesterol || 0,
        confidence: item.confidence,
        source_note: item.source_note,
      };
    });

    // Filter out placeholder items (all macros zero = AI couldn't identify real food)
    const validItems = mergedItems.filter(item => 
      item.calories > 0 || item.protein > 0 || item.carbs > 0 || item.fat > 0
    );

    // Calculate totals
    const totals = validItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fiber: acc.fiber + item.fiber,
        sugar: acc.sugar + item.sugar,
        fat: acc.fat + item.fat,
        saturated_fat: acc.saturated_fat + item.saturated_fat,
        sodium: acc.sodium + item.sodium,
        cholesterol: acc.cholesterol + item.cholesterol,
      }),
      { calories: 0, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 0, saturated_fat: 0, sodium: 0, cholesterol: 0 }
    );

    const result: AnalyzeResponse = {
      food_items: mergedItems,
      total_calories: Math.round(totals.calories),
      total_protein: Math.round(totals.protein),
      total_carbs: Math.round(totals.carbs),
      total_fiber: Math.round(totals.fiber),
      total_net_carbs: Math.round(Math.max(0, totals.carbs - totals.fiber)),
      total_sugar: Math.round(totals.sugar),
      total_fat: Math.round(totals.fat),
      total_saturated_fat: Math.round(totals.saturated_fat),
      total_sodium: Math.round(totals.sodium),
      total_cholesterol: Math.round(totals.cholesterol),
    };

    console.log('Analysis result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in analyze-food function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
