import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAnalyzeFoodPrompt, interpolatePrompt, type PromptVersion } from "../_shared/prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestCase {
  input: string;
  additionalContext?: string;
}

interface TestResult {
  input: string;
  additionalContext?: string;
  output: unknown;
  latencyMs: number;
  error?: string;
}

interface ParsedFoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

serve(async (req) => {
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    
    // Check admin role
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: userId, _role: 'admin' });
    
    if (roleError || !isAdmin) {
      console.log('Admin check failed:', roleError?.message || 'Not an admin');
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { testCases, promptVersion = 'default', iterations = 1 } = await req.json();

    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return new Response(
        JSON.stringify({ error: 'testCases array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const version: PromptVersion = promptVersion === 'experimental' ? 'experimental' : 'default';
    const runId = crypto.randomUUID();
    const results: TestResult[] = [];

    console.log(`Starting test run ${runId}: ${testCases.length} cases × ${iterations} iterations = ${testCases.length * iterations} total`);
    console.log(`Prompt version: ${version}`);

    for (const testCase of testCases as TestCase[]) {
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        try {
          const promptTemplate = getAnalyzeFoodPrompt(version);
          const prompt = interpolatePrompt(promptTemplate, testCase.input, testCase.additionalContext);

          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-3-flash-preview',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.3,
            }),
          });

          const latencyMs = Date.now() - startTime;

          if (!response.ok) {
            const errorText = await response.text();
            results.push({
              input: testCase.input,
              additionalContext: testCase.additionalContext,
              output: null,
              latencyMs,
              error: `AI Gateway error: ${errorText}`,
            });
            continue;
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;

          if (!content) {
            results.push({
              input: testCase.input,
              additionalContext: testCase.additionalContext,
              output: null,
              latencyMs,
              error: 'No content in AI response',
            });
            continue;
          }

          // Parse AI response
          let parsed: { food_items: ParsedFoodItem[] };
          try {
            let cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
            const jsonStart = cleanContent.indexOf('{');
            const jsonEnd = cleanContent.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
              cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
            }
            parsed = JSON.parse(cleanContent);
          } catch {
            results.push({
              input: testCase.input,
              additionalContext: testCase.additionalContext,
              output: { raw: content },
              latencyMs,
              error: 'Failed to parse AI response',
            });
            continue;
          }

          // Merge name and portion into description
          const mergedItems = parsed.food_items.map(item => ({
            description: item.portion ? `${item.name} (${item.portion})` : item.name,
            calories: item.calories || 0,
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fat: item.fat || 0,
          }));

          const result: TestResult = {
            input: testCase.input,
            additionalContext: testCase.additionalContext,
            output: { food_items: mergedItems },
            latencyMs,
          };

          results.push(result);

          // Insert into database
          const { error: insertError } = await supabase
            .from('prompt_tests')
            .insert({
              run_id: runId,
              prompt_version: version,
              test_input: testCase.input,
              additional_context: testCase.additionalContext,
              actual_output: { food_items: mergedItems },
              latency_ms: latencyMs,
            });

          if (insertError) {
            console.error('Failed to insert test result:', insertError);
          }

        } catch (error) {
          const latencyMs = Date.now() - startTime;
          results.push({
            input: testCase.input,
            additionalContext: testCase.additionalContext,
            output: null,
            latencyMs,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    console.log(`Test run ${runId} complete: ${results.length} results`);

    return new Response(
      JSON.stringify({
        run_id: runId,
        prompt_version: version,
        total: results.length,
        successful: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in run-prompt-tests:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
