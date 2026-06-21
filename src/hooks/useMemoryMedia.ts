import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { invalidateCustomLogCaches } from './invalidateCustomLogCaches';
import {
  MEMORY_BUCKET,
  mediaKindFromMime,
  fileExtension,
  buildMediaPath,
  buildPosterPath,
  processImageFile,
  extractVideoMeta,
} from '@/lib/memory-media';

export interface MemoryMedia {
  id: string;
  user_id: string;
  created_by: string | null;
  entry_id: string;
  storage_path: string;
  kind: 'image' | 'video';
  mime_type: string | null;
  width: number | null;
  height: number | null;
  duration_secs: number | null;
  poster_path: string | null;
  sort_order: number;
  created_at: string;
}

export type FileUploadStatus = 'queued' | 'uploading' | 'done';

export interface CreateMemoryParams {
  logTypeId: string;
  loggedDate: string;
  note: string | null;
  category: string | null;
  files: File[];
  onFileProgress?: (index: number, status: FileUploadStatus) => void;
}

interface UploadedFile {
  mediaPath: string;
  posterPath: string | null;
  kind: 'image' | 'video';
  mime: string;
  width: number | null;
  height: number | null;
  duration: number | null;
}

/**
 * Atomic, media-first memory creation:
 * 1. Upload every file (and video posters) to storage first.
 * 2. Only after all uploads succeed, insert the entry + media rows.
 * If anything fails, already-uploaded files are cleaned up so no orphans or
 * "ghost" memories are left behind.
 */
export function useCreateMemory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createMemory = useMutation({
    mutationFn: async (params: CreateMemoryParams) => {
      if (!user) throw new Error('No user');
      const { logTypeId, loggedDate, note, category, files, onFileProgress } = params;
      const entryId = crypto.randomUUID();
      const uploaded: UploadedFile[] = [];

      const cleanup = async () => {
        const paths = uploaded.flatMap((u) =>
          [u.mediaPath, u.posterPath].filter(Boolean) as string[],
        );
        if (paths.length) {
          try {
            await supabase.storage.from(MEMORY_BUCKET).remove(paths);
          } catch {
            /* best-effort */
          }
        }
      };

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const kind = mediaKindFromMime(file.type);
          if (!kind) throw new Error(`Unsupported file type: ${file.name}`);
          const mediaId = crypto.randomUUID();
          const ext = fileExtension(file.name, kind);
          const mediaPath = buildMediaPath(user.id, entryId, mediaId, ext);
          onFileProgress?.(i, 'uploading');

          if (kind === 'image') {
            const { blob, width, height } = await processImageFile(file);
            const { error } = await supabase.storage
              .from(MEMORY_BUCKET)
              .upload(mediaPath, blob, { contentType: 'image/jpeg', upsert: false });
            if (error) throw error;
            uploaded.push({
              mediaPath,
              posterPath: null,
              kind,
              mime: 'image/jpeg',
              width,
              height,
              duration: null,
            });
          } else {
            const meta = await extractVideoMeta(file);
            const { error } = await supabase.storage
              .from(MEMORY_BUCKET)
              .upload(mediaPath, file, { contentType: file.type, upsert: false });
            if (error) throw error;
            let posterPath: string | null = null;
            if (meta.posterBlob) {
              posterPath = buildPosterPath(user.id, entryId, mediaId);
              const { error: posterErr } = await supabase.storage
                .from(MEMORY_BUCKET)
                .upload(posterPath, meta.posterBlob, {
                  contentType: 'image/jpeg',
                  upsert: false,
                });
              if (posterErr) posterPath = null; // poster is best-effort
            }
            uploaded.push({
              mediaPath,
              posterPath,
              kind,
              mime: file.type || 'video/mp4',
              width: meta.width || null,
              height: meta.height || null,
              duration: meta.duration || null,
            });
          }
          onFileProgress?.(i, 'done');
        }

        // All uploads succeeded — now persist the DB rows.
        const { data: entry, error: entryErr } = await supabase
          .from('custom_log_entries')
          .insert({
            id: entryId,
            user_id: user.id,
            created_by: user.id,
            log_type_id: logTypeId,
            logged_date: loggedDate,
            text_value: note?.trim() || null,
            category: category?.trim() || null,
          })
          .select()
          .single();
        if (entryErr) {
          await cleanup();
          throw entryErr;
        }

        if (uploaded.length > 0) {
          const rows = uploaded.map((u, idx) => ({
            user_id: user.id,
            created_by: user.id,
            entry_id: entryId,
            storage_path: u.mediaPath,
            kind: u.kind,
            mime_type: u.mime,
            width: u.width,
            height: u.height,
            duration_secs: u.duration,
            poster_path: u.posterPath,
            sort_order: idx,
          }));
          const { error: mediaErr } = await supabase.from('memory_media').insert(rows);
          if (mediaErr) {
            // Entry persisted but media insert failed — roll back the entry and files.
            await supabase.from('custom_log_entries').delete().eq('id', entryId);
            await cleanup();
            throw mediaErr;
          }
        }

        return { entry, logTypeId, loggedDate };
      } catch (err) {
        await cleanup();
        throw err;
      }
    },
    onSuccess: ({ logTypeId, loggedDate }) => {
      queryClient.invalidateQueries({ queryKey: ['memory-days', logTypeId] });
      invalidateCustomLogCaches(queryClient, {
        logTypeId,
        loggedDate,
        userId: user?.id,
      });
    },
  });

  return { createMemory };
}
