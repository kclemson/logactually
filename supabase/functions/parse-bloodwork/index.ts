import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { canonicalize } from '../_shared/bloodwork-canonical.ts';

interface ExtractedResult {
  analyte_name: string;
  numeric_value?: number | string | null;
  unit?: string | null;
  reference_low?: number | string | null;
  reference_high?: number | string | null;
  reference_raw?: string | null;
  flag?: string | null;
}

interface ExtractedSection {
  section_title?: string | null;
  results?: ExtractedResult[];
}

interface ExtractedPanel {
  collected_date?: string | null;
  panel_title?: string | null;
  sections?: ExtractedSection[];
}

const SYSTEM_PROMPT = `You extract structured lab results from a bloodwork document (PDF or image).
Extract every result you can see — do not skip any analyte. Preserve the section/panel headings exactly as printed (e.g. "CBC With Differential/Platelet", "Lipid Panel", "Iron and TIBC", "Comprehensive Metabolic Panel") so values stay grouped the way the lab printed them.
For each result include: the analyte name as printed, the numeric value, the unit, and the reference range if shown.
If a value is non-numeric (e.g. "Not Estab.", "Positive"), put it in reference_raw or leave numeric_value null — never guess a number.
Use collected_date for the date the specimen was drawn (YYYY-MM-DD). Use panel_title for the full document title.
Do not invent results. If the document is unreadable, return empty sections.`;

const TOOL_SCHEMA = {
  type: 'function' as const,
  function: {
    name: 'extract_bloodwork',
    description: 'Return the structured bloodwork panel extracted from the document.',
    parameters: {
      type: 'object',
      properties: {
        collected_date: { type: 'string', description: 'YYYY-MM-DD date the specimen was collected.' },
        panel_title: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section_title: { type: 'string', description: 'Heading exactly as printed in the document.' },
              results: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    analyte_name: { type: 'string' },
                    numeric_value: { type: ['number', 'null'] },
                    unit: { type: ['string', 'null'] },
                    reference_low: { type: ['number', 'null'] },
                    reference_high: { type: ['number', 'null'] },
                    reference_raw: { type: ['string', 'null'] },
                    flag: { type: ['string', 'null'], description: 'H, L, or other lab abnormality marker if shown.' },
                  },
                  required: ['analyte_name'],
                },
              },
            },
            required: ['section_title', 'results'],
          },
        },
      },
      required: ['sections'],
    },
  },
};

async function callGateway(model: string, base64: string, mimeType: string): Promise<ExtractedPanel | null> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

  const body = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract every lab result from this document.' },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      },
    ],
    tools: [TOOL_SCHEMA],
    tool_choice: { type: 'function', function: { name: 'extract_bloodwork' } },
  };

  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(`Gateway ${model} error ${resp.status}:`, text);
    if (resp.status === 429 || resp.status === 402) {
      throw new Response(JSON.stringify({ error: resp.status === 429 ? 'Rate limit hit, try again in a moment.' : 'AI credits exhausted.' }), {
        status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return null;
  }

  const json = await resp.json();
  const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return null;
  try {
    return JSON.parse(toolCall.function.arguments) as ExtractedPanel;
  } catch (e) {
    console.error('Failed to parse tool args:', e);
    return null;
  }
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isValidDate(s: string | null | undefined): s is string {
  if (!s || typeof s !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime());
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    const { panel_id } = await req.json();
    if (!panel_id || typeof panel_id !== 'string') {
      return new Response(JSON.stringify({ error: 'panel_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: panel, error: panelErr } = await admin
      .from('bloodwork_panels')
      .select('*')
      .eq('id', panel_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (panelErr || !panel) {
      return new Response(JSON.stringify({ error: 'Panel not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: fileBlob, error: dlErr } = await admin.storage
      .from('bloodwork-files')
      .download(panel.storage_path);
    if (dlErr || !fileBlob) {
      await admin.from('bloodwork_panels').update({
        parse_status: 'failed', parse_error: `Download failed: ${dlErr?.message ?? 'unknown'}`,
      }).eq('id', panel_id);
      return new Response(JSON.stringify({ error: 'File download failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const buf = new Uint8Array(await fileBlob.arrayBuffer());
    let binary = '';
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const base64 = btoa(binary);
    const mimeType = panel.source_mime_type || fileBlob.type || 'application/pdf';

    let extracted: ExtractedPanel | null = null;
    try {
      extracted = await callGateway('google/gemini-2.5-pro', base64, mimeType);
    } catch (e) {
      if (e instanceof Response) return e;
      console.error('Gemini call threw:', e);
    }
    if (!extracted || !extracted.sections?.length) {
      try {
        extracted = await callGateway('openai/gpt-5', base64, mimeType);
      } catch (e) {
        if (e instanceof Response) return e;
        console.error('OpenAI call threw:', e);
      }
    }

    if (!extracted || !extracted.sections?.length) {
      await admin.from('bloodwork_panels').update({
        parse_status: 'failed', parse_error: 'AI could not extract any results.',
      }).eq('id', panel_id);
      return new Response(JSON.stringify({ error: 'No results extracted' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve collected_date from extraction (source of truth).
    const collectedDate = isValidDate(extracted.collected_date) ? extracted.collected_date : null;

    // Build result rows.
    const rows: Record<string, unknown>[] = [];
    const canonicalKeys: string[] = [];
    const sectionTitles: string[] = [];
    const seenSections = new Set<string>();
    extracted.sections.forEach((section, sIdx) => {
      let sectionHadRow = false;
      (section.results ?? []).forEach((r, rIdx) => {
        if (!r.analyte_name) return;
        const { canonical_key, display_name } = canonicalize(r.analyte_name);
        canonicalKeys.push(canonical_key);
        rows.push({
          user_id: userId,
          panel_id,
          collected_date: collectedDate,
          panel_section: section.section_title ?? null,
          section_order: sIdx,
          result_order: rIdx,
          analyte_name: r.analyte_name,
          canonical_key,
          display_name,
          numeric_value: toNum(r.numeric_value),
          unit: r.unit ?? null,
          reference_low: toNum(r.reference_low),
          reference_high: toNum(r.reference_high),
          reference_raw: r.reference_raw ?? null,
          flag: r.flag ?? null,
        });
        sectionHadRow = true;
      });
      const title = section.section_title?.trim();
      if (sectionHadRow && title && !seenSections.has(title)) {
        seenSections.add(title);
        sectionTitles.push(title);
      }
    });

    if (rows.length === 0) {
      await admin.from('bloodwork_panels').update({
        parse_status: 'failed', parse_error: 'Extraction returned no analyte rows.', raw_extraction: extracted,
      }).eq('id', panel_id);
      return new Response(JSON.stringify({ error: 'No results extracted' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Compute content_signature for Layer 2 duplicate detection.
    const sortedKeys = [...canonicalKeys].sort();
    const contentSignature = `${collectedDate ?? 'nodate'}:${sortedKeys.join(',')}`;

    // Layer 2: check for existing success panel with same (user, collected_date, signature).
    let duplicateOf: string | null = null;
    if (collectedDate) {
      const { data: dupes } = await admin
        .from('bloodwork_panels')
        .select('id')
        .eq('user_id', userId)
        .eq('collected_date', collectedDate)
        .eq('content_signature', contentSignature)
        .eq('parse_status', 'success')
        .neq('id', panel_id)
        .limit(1);
      if (dupes && dupes.length > 0) {
        duplicateOf = dupes[0].id;
      }
    }

    if (duplicateOf) {
      // Hold as duplicate_pending — do not insert results yet; client will resolve.
      await admin.from('bloodwork_panels').update({
        parse_status: 'duplicate_pending',
        parse_error: null,
        collected_date: collectedDate,
        panel_title: extracted.panel_title ?? panel.panel_title ?? null,
        content_signature: contentSignature,
        raw_extraction: { ...extracted, duplicate_of: duplicateOf },
      }).eq('id', panel_id);

      return new Response(JSON.stringify({ ok: true, duplicate_of: duplicateOf }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Replace any prior results for this panel (in case of retry), then insert fresh.
    await admin.from('bloodwork_results').delete().eq('panel_id', panel_id);
    const { error: insertErr } = await admin.from('bloodwork_results').insert(rows);
    if (insertErr) {
      console.error('Insert results failed:', insertErr);
      await admin.from('bloodwork_panels').update({
        parse_status: 'failed', parse_error: `DB insert failed: ${insertErr.message}`, raw_extraction: extracted,
      }).eq('id', panel_id);
      return new Response(JSON.stringify({ error: 'Failed to save results' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await admin.from('bloodwork_panels').update({
      parse_status: 'success',
      parse_error: collectedDate ? null : 'Could not find a collection date in the document — please set one manually.',
      collected_date: collectedDate,
      panel_title: extracted.panel_title ?? panel.panel_title ?? null,
      content_signature: contentSignature,
      raw_extraction: extracted,
    }).eq('id', panel_id);

    return new Response(JSON.stringify({ ok: true, result_count: rows.length, collected_date: collectedDate }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('parse-bloodwork error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
