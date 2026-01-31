import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface DebugEvent {
  event: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { events } = await req.json() as { events: DebugEvent[] };
    
    // Log each event with a clear prefix for easy filtering
    for (const event of events) {
      console.log(`[SCANNER_DEBUG] ${event.event}:`, JSON.stringify({
        ...event.data,
        timestamp: event.timestamp || new Date().toISOString(),
      }));
    }

    return new Response(
      JSON.stringify({ success: true, logged: events.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SCANNER_DEBUG] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to log debug events' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
