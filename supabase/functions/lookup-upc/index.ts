import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenFoodFactsProduct {
  product_name?: string;
  serving_size?: string;
  nutriments?: {
    'energy-kcal_serving'?: number;
    'energy-kcal_100g'?: number;
    proteins_serving?: number;
    proteins_100g?: number;
    carbohydrates_serving?: number;
    carbohydrates_100g?: number;
    fat_serving?: number;
    fat_100g?: number;
  };
}

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

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

    // Parse request
    const { upc } = await req.json();

    if (!upc || typeof upc !== 'string') {
      return new Response(
        JSON.stringify({ error: 'UPC code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean UPC - remove any non-numeric characters
    const cleanUpc = upc.replace(/\D/g, '');
    console.log('Looking up UPC:', cleanUpc);

    // Step 1: Try Open Food Facts
    try {
      const offResponse = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${cleanUpc}.json`,
        { headers: { 'User-Agent': 'FoodLog/1.0' } }
      );
      
      if (offResponse.ok) {
        const offData: OpenFoodFactsResponse = await offResponse.json();
        console.log('Open Food Facts response status:', offData.status);

        if (offData.status === 1 && offData.product) {
          const product = offData.product;
          const nutriments = product.nutriments || {};

          // Extract serving size info
          const servingSize = product.serving_size || '1 serving';
          const productName = product.product_name || 'Unknown product';

          // Prefer per-serving values, fall back to per-100g
          const calories = Math.round(
            nutriments['energy-kcal_serving'] ?? nutriments['energy-kcal_100g'] ?? 0
          );
          const protein = Math.round(
            nutriments.proteins_serving ?? nutriments.proteins_100g ?? 0
          );
          const carbs = Math.round(
            nutriments.carbohydrates_serving ?? nutriments.carbohydrates_100g ?? 0
          );
          const fat = Math.round(
            nutriments.fat_serving ?? nutriments.fat_100g ?? 0
          );

          console.log('Found product in Open Food Facts:', productName);

          return new Response(
            JSON.stringify({
              description: `${productName} \u200B(${servingSize})`,
              calories,
              protein,
              carbs,
              fat,
              source: 'openfoodfacts',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (offError) {
      console.error('Open Food Facts API error:', offError);
      // Continue to AI fallback
    }

    // Step 2: Fallback to AI
    console.log('Product not found in Open Food Facts, using AI fallback');

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ notFound: true, upc: cleanUpc }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [{
            role: 'user',
            content: `What food product has UPC barcode ${cleanUpc}? 
I need the product name and nutritional information for one typical serving.

IMPORTANT: Respond ONLY with valid JSON, no markdown formatting, no code blocks.
Use this exact format:
{"name": "Product Name", "serving": "serving size description", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}

If you cannot identify the product, respond with:
{"unknown": true}`
          }],
          temperature: 0.3,
        }),
      });

      if (!aiResponse.ok) {
        console.error('AI API error:', aiResponse.status);
        return new Response(
          JSON.stringify({ notFound: true, upc: cleanUpc }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content?.trim();
      
      if (!content) {
        console.error('Empty AI response');
        return new Response(
          JSON.stringify({ notFound: true, upc: cleanUpc }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('AI response:', content);

      // Parse AI response - handle potential markdown code blocks
      let parsed;
      try {
        let jsonStr = content;
        // Remove markdown code blocks if present
        if (jsonStr.includes('```')) {
          jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }
        parsed = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        return new Response(
          JSON.stringify({ notFound: true, upc: cleanUpc }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (parsed.unknown) {
        console.log('AI could not identify product');
        return new Response(
          JSON.stringify({ notFound: true, upc: cleanUpc }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('AI identified product:', parsed.name);

      return new Response(
        JSON.stringify({
          description: `${parsed.name} \u200B(${parsed.serving || '1 serving'})`,
          calories: Math.round(parsed.calories || 0),
          protein: Math.round(parsed.protein || 0),
          carbs: Math.round(parsed.carbs || 0),
          fat: Math.round(parsed.fat || 0),
          source: 'ai',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (aiError) {
      console.error('AI fallback error:', aiError);
      return new Response(
        JSON.stringify({ notFound: true, upc: cleanUpc }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in lookup-upc:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
