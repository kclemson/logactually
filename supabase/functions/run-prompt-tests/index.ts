import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { PromptVersion } from "../_shared/prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TestCase {
  input: string;
  additionalContext?: string;
  source?: 'upc-lookup' | 'ai' | 'ai-fallback';
}

interface TestResult {
  input: string;
  additionalContext?: string;
  output: unknown;
  latencyMs: number;
  error?: string;
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

    const { testCases, promptVersion = 'default', iterations = 1, testType = 'food' } = await req.json();

    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return new Response(
        JSON.stringify({ error: 'testCases array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const version: PromptVersion = promptVersion === 'experimental' ? 'experimental' : 'default';
    const runId = crypto.randomUUID();
    const results: TestResult[] = [];

    // Route to correct function based on testType
    const functionName = testType === 'weights' ? 'analyze-weights' : 'analyze-food';
    console.log(`Starting test run ${runId}: ${testCases.length} cases × ${iterations} iterations = ${testCases.length * iterations} total`);
    console.log(`Prompt version: ${version}, Test type: ${testType}`);

    // Build the function URL
    const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${functionName}`;

    for (const testCase of testCases as TestCase[]) {
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        try {
          // Call the appropriate function directly
          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              rawInput: testCase.input,
              additionalContext: testCase.additionalContext,
              promptVersion: version,
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
              error: `analyze-food error (${response.status}): ${errorText}`,
            });
            continue;
          }

          const data = await response.json();

          // Check if analyze-food returned an error
          if (data.error) {
            results.push({
              input: testCase.input,
              additionalContext: testCase.additionalContext,
              output: null,
              latencyMs,
              error: data.error,
            });
            continue;
          }

          // Handle different response shapes based on testType
          const actualOutput = testType === 'weights' 
            ? { exercises: data.exercises }
            : { food_items: data.food_items };

          const result: TestResult = {
            input: testCase.input,
            additionalContext: testCase.additionalContext,
            output: actualOutput,
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
              actual_output: actualOutput,
              latency_ms: latencyMs,
              source: testCase.source || 'ai',
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
