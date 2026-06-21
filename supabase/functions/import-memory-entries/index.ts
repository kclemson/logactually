import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const MEMORY_BUCKET = 'memory-media';

const BodySchema = z.object({
  logTypeId: z.string().uuid(),
  loggedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        width: z.number().optional(),
        height: z.number().optional(),
      }),
    )
    .max(50),
});

/** Map a content-type to a media kind + file extension. */
function describeImage(contentType: string | null): { ext: string; mime: string } {
  const ct = (contentType ?? '').toLowerCase();
  if (ct.includes('png')) return { ext: 'png', mime: 'image/png' };
  if (ct.includes('webp')) return { ext: 'webp', mime: 'image/webp' };
  if (ct.includes('gif')) return { ext: 'gif', mime: 'image/gif' };
  return { ext: 'jpg', mime: 'image/jpeg' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const userId = claimsData.claims.sub as string;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const { logTypeId, loggedDate, note, category, images } = parsed.data;

    const entryId = crypto.randomUUID();
    const uploadedPaths: string[] = [];

    const cleanup = async () => {
      if (uploadedPaths.length) {
        try {
          await supabase.storage.from(MEMORY_BUCKET).remove(uploadedPaths);
        } catch {
          /* best-effort */
        }
      }
    };

    interface MediaRow {
      storage_path: string;
      mime: string;
      width: number | null;
      height: number | null;
    }
    const mediaRows: MediaRow[] = [];

    try {
      for (const image of images) {
        const res = await fetch(image.url);
        if (!res.ok) {
          throw new Error(`Failed to download image (${res.status})`);
        }
        const { ext, mime } = describeImage(res.headers.get('content-type'));
        const bytes = new Uint8Array(await res.arrayBuffer());
        const mediaId = crypto.randomUUID();
        const path = `${userId}/${entryId}/${mediaId}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(MEMORY_BUCKET)
          .upload(path, bytes, { contentType: mime, upsert: false });
        if (upErr) throw upErr;
        uploadedPaths.push(path);
        mediaRows.push({
          storage_path: path,
          mime,
          width: image.width ?? null,
          height: image.height ?? null,
        });
      }

      const { error: entryErr } = await supabase.from('custom_log_entries').insert({
        id: entryId,
        user_id: userId,
        created_by: userId,
        log_type_id: logTypeId,
        logged_date: loggedDate,
        text_value: note?.trim() || null,
        category: category?.trim() || null,
      });
      if (entryErr) throw entryErr;

      if (mediaRows.length > 0) {
        const rows = mediaRows.map((m, idx) => ({
          user_id: userId,
          created_by: userId,
          entry_id: entryId,
          storage_path: m.storage_path,
          kind: 'image',
          mime_type: m.mime,
          width: m.width,
          height: m.height,
          duration_secs: null,
          poster_path: null,
          sort_order: idx,
        }));
        const { error: mediaErr } = await supabase.from('memory_media').insert(rows);
        if (mediaErr) {
          await supabase.from('custom_log_entries').delete().eq('id', entryId);
          throw mediaErr;
        }
      }

      return json({ entryId, mediaCount: mediaRows.length });
    } catch (err) {
      await cleanup();
      const message = err instanceof Error ? err.message : 'Import failed';
      return json({ error: message }, 500);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return json({ error: message }, 500);
  }
});
