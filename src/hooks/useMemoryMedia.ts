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
  uploadMemoryFileResumable,
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
  /** The name of the file the user originally uploaded, kept so data exports
   * can use friendly filenames instead of the GUID storage path. Null for media
   * uploaded before this was captured. */
  original_filename: string | null;
  /** Pre-signed, resized thumbnail URL, attached up-front by list/cover hooks so
   * thumbnails render without each one minting its own signed URL. */
  thumbUrl?: string | null;
}

export type FileUploadStatus = 'queued' | 'uploading' | 'done';

/**
 * Report per-file upload progress. `progress` is the fraction (0..1) of bytes
 * uploaded for that file; for 'queued'/'done' it's 0/1 respectively.
 */
export type FileProgressFn = (
  index: number,
  status: FileUploadStatus,
  progress: number,
) => void;

export interface CreateMemoryParams {
  logTypeId: string;
  loggedDate: string;
  note: string | null;
  category: string | null;
  files: File[];
  onFileProgress?: FileProgressFn;
}

interface UploadedFile {
  mediaPath: string;
  posterPath: string | null;
  kind: 'image' | 'video';
  mime: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  originalName: string;
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
          onFileProgress?.(i, 'uploading', 0);

          if (kind === 'image') {
            const { blob, width, height } = await processImageFile(file);
            await uploadMemoryFileResumable(mediaPath, blob, 'image/jpeg', (p) =>
              onFileProgress?.(i, 'uploading', p),
            );
            uploaded.push({
              mediaPath,
              posterPath: null,
              kind,
              mime: 'image/jpeg',
              width,
              height,
              duration: null,
              originalName: file.name,
            });
          } else {
            const meta = await extractVideoMeta(file);
            await uploadMemoryFileResumable(
              mediaPath,
              file,
              file.type || 'video/mp4',
              (p) => onFileProgress?.(i, 'uploading', p),
            );
            let posterPath: string | null = null;
            if (meta.posterBlob) {
              posterPath = buildPosterPath(user.id, entryId, mediaId);
              try {
                await uploadMemoryFileResumable(
                  posterPath,
                  meta.posterBlob,
                  'image/jpeg',
                );
              } catch {
                posterPath = null; // poster is best-effort
              }
            }
            uploaded.push({
              mediaPath,
              posterPath,
              kind,
              mime: file.type || 'video/mp4',
              width: meta.width || null,
              height: meta.height || null,
              duration: meta.duration || null,
              originalName: file.name,
            });
          }
          onFileProgress?.(i, 'done', 1);
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
            original_filename: u.originalName,
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

/** One slot in an edited memory's final, ordered media list. */
export type EditMediaItem =
  | { type: 'existing'; media: MemoryMedia }
  | { type: 'new'; file: File };

export interface UpdateMemoryParams {
  entryId: string;
  logTypeId: string;
  loggedDate: string;
  /** The entry's date before this edit, so we can refresh both days if it moved. */
  originalDate: string;
  note: string | null;
  category: string | null;
  /** The full original media set for this entry (to diff against). */
  originalMedia: MemoryMedia[];
  /** Final ordered media list (existing kept + new uploads). */
  items: EditMediaItem[];
  /** Progress callback keyed by the item index within `items`. */
  onItemProgress?: FileProgressFn;
}

/**
 * Edit an existing memory: update its caption/category, add/remove media, and
 * persist the on-screen ordering. New files upload first (with posters); only
 * once uploads succeed do we mutate DB rows. Removed files are cleaned from
 * storage best-effort, mirroring the delete path.
 */
export function useUpdateMemory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateMemory = useMutation({
    mutationFn: async (params: UpdateMemoryParams) => {
      if (!user) throw new Error('No user');
      const {
        entryId,
        logTypeId,
        loggedDate,
        originalDate,
        note,
        category,
        originalMedia,
        items,
        onItemProgress,
      } = params;

      // Track freshly uploaded paths so we can roll them back on failure.
      const newlyUploaded: string[] = [];
      const cleanupNew = async () => {
        if (newlyUploaded.length) {
          try {
            await supabase.storage.from(MEMORY_BUCKET).remove(newlyUploaded);
          } catch {
            /* best-effort */
          }
        }
      };

      try {
        // 1. Upload any newly-added files, building the final ordered media rows.
        interface FinalRow {
          existingId: string | null;
          storage_path: string;
          poster_path: string | null;
          kind: 'image' | 'video';
          mime: string | null;
          width: number | null;
          height: number | null;
          duration: number | null;
          original_filename: string | null;
        }
        const finalRows: FinalRow[] = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type === 'existing') {
            const m = item.media;
            finalRows.push({
              existingId: m.id,
              storage_path: m.storage_path,
              poster_path: m.poster_path,
              kind: m.kind,
              mime: m.mime_type,
              width: m.width,
              height: m.height,
              duration: m.duration_secs,
              original_filename: m.original_filename,
            });
            continue;
          }

          const file = item.file;
          const kind = mediaKindFromMime(file.type);
          if (!kind) throw new Error(`Unsupported file type: ${file.name}`);
          const mediaId = crypto.randomUUID();
          const ext = fileExtension(file.name, kind);
          const mediaPath = buildMediaPath(user.id, entryId, mediaId, ext);
          onItemProgress?.(i, 'uploading', 0);

          if (kind === 'image') {
            const { blob, width, height } = await processImageFile(file);
            await uploadMemoryFileResumable(mediaPath, blob, 'image/jpeg', (p) =>
              onItemProgress?.(i, 'uploading', p),
            );
            newlyUploaded.push(mediaPath);
            finalRows.push({
              existingId: null,
              storage_path: mediaPath,
              poster_path: null,
              kind,
              mime: 'image/jpeg',
              width,
              height,
              duration: null,
              original_filename: file.name,
            });
          } else {
            const meta = await extractVideoMeta(file);
            await uploadMemoryFileResumable(
              mediaPath,
              file,
              file.type || 'video/mp4',
              (p) => onItemProgress?.(i, 'uploading', p),
            );
            newlyUploaded.push(mediaPath);
            let posterPath: string | null = null;
            if (meta.posterBlob) {
              posterPath = buildPosterPath(user.id, entryId, mediaId);
              try {
                await uploadMemoryFileResumable(
                  posterPath,
                  meta.posterBlob,
                  'image/jpeg',
                );
                newlyUploaded.push(posterPath);
              } catch {
                posterPath = null;
              }
            }
            finalRows.push({
              existingId: null,
              storage_path: mediaPath,
              poster_path: posterPath,
              kind,
              mime: file.type || 'video/mp4',
              width: meta.width || null,
              height: meta.height || null,
              duration: meta.duration || null,
              original_filename: file.name,
            });
          }
          onItemProgress?.(i, 'done', 1);
        }

        // 2. Update the entry's caption, category + date.
        const { error: entryErr } = await supabase
          .from('custom_log_entries')
          .update({
            text_value: note?.trim() || null,
            category: category?.trim() || null,
            logged_date: loggedDate,
          })
          .eq('id', entryId);
        if (entryErr) throw entryErr;

        // 3. Insert rows for new media, with sort_order matching their position.
        const newInserts = finalRows
          .map((r, idx) => ({ r, idx }))
          .filter(({ r }) => r.existingId === null)
          .map(({ r, idx }) => ({
            user_id: user.id,
            created_by: user.id,
            entry_id: entryId,
            storage_path: r.storage_path,
            kind: r.kind,
            mime_type: r.mime,
            width: r.width,
            height: r.height,
            duration_secs: r.duration,
            poster_path: r.poster_path,
            sort_order: idx,
            original_filename: r.original_filename,
          }));
        if (newInserts.length > 0) {
          const { error: insErr } = await supabase.from('memory_media').insert(newInserts);
          if (insErr) throw insErr;
        }

        // 4. Re-sequence kept existing media to their new positions.
        for (let idx = 0; idx < finalRows.length; idx++) {
          const r = finalRows[idx];
          if (r.existingId) {
            const { error: updErr } = await supabase
              .from('memory_media')
              .update({ sort_order: idx })
              .eq('id', r.existingId);
            if (updErr) throw updErr;
          }
        }

        // 5. Delete media the user removed (rows + storage, best-effort).
        const keptIds = new Set(
          finalRows.map((r) => r.existingId).filter(Boolean) as string[],
        );
        const removed = originalMedia.filter((m) => !keptIds.has(m.id));
        if (removed.length > 0) {
          const paths = removed.flatMap((m) =>
            [m.storage_path, m.poster_path].filter(Boolean) as string[],
          );
          if (paths.length > 0) {
            try {
              await supabase.storage.from(MEMORY_BUCKET).remove(paths);
            } catch {
              /* best-effort */
            }
          }
          const { error: delErr } = await supabase
            .from('memory_media')
            .delete()
            .in('id', removed.map((m) => m.id));
          if (delErr) throw delErr;
        }

        return { entryId, logTypeId, loggedDate, originalDate };
      } catch (err) {
        await cleanupNew();
        throw err;
      }
    },
    onSuccess: ({ logTypeId, loggedDate, originalDate }) => {
      queryClient.invalidateQueries({ queryKey: ['memory-days', logTypeId] });
      invalidateCustomLogCaches(queryClient, {
        logTypeId,
        loggedDate,
        userId: user?.id,
      });
      // If the date changed, the original day's caches need refreshing too.
      if (originalDate && originalDate !== loggedDate) {
        invalidateCustomLogCaches(queryClient, {
          logTypeId,
          loggedDate: originalDate,
          userId: user?.id,
        });
      }
    },
  });

  return { updateMemory };
}
