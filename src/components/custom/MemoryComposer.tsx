import { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  ImagePlus,
  Loader2,
  Play,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import {
  useCreateMemory,
  useUpdateMemory,
  type FileUploadStatus,
  type EditMediaItem,
  type MemoryMedia,
} from '@/hooks/useMemoryMedia';
import type { MemoryEntry } from '@/hooks/useMemoryDays';
import { mediaKindFromMime, getSignedMemoryUrl, type MediaKind } from '@/lib/memory-media';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MemoryScaffold } from './MemoryScaffold';
import { MemoryStage } from './MemoryStage';
import { MemoryActionBar, type MemoryAction } from './MemoryActionBar';

interface MemoryComposerProps {
  label: string;
  logTypeId: string;
  loggedDate: string;
  existingCategories?: string[];
  /** When provided, the composer edits this memory instead of creating one. */
  editEntry?: MemoryEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

/**
 * A slide in the composer: either a newly-picked local file (object URL preview)
 * or an existing media row being edited (signed URL preview, resolved on mount).
 */
type PendingFile =
  | {
      id: string;
      source: 'new';
      file: File;
      kind: MediaKind;
      previewUrl: string;
      status: FileUploadStatus;
    }
  | {
      id: string;
      source: 'existing';
      media: MemoryMedia;
      kind: MediaKind;
      previewUrl: string; // '' until the signed URL resolves
      status: FileUploadStatus;
    };

// Fixed, tasteful backdrop for text-only memories (and the empty canvas).
const TEXT_GRADIENT =
  'linear-gradient(150deg, hsl(174 64% 18%) 0%, hsl(199 70% 14%) 45%, hsl(222 47% 11%) 100%)';

export function MemoryComposer({
  label,
  logTypeId,
  loggedDate: loggedDateProp,
  existingCategories = [],
  editEntry,
  onSuccess,
  onCancel,
  disabled,
}: MemoryComposerProps) {
  const isEditing = !!editEntry;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState(() => editEntry?.text_value ?? '');
  const [category, setCategory] = useState(() => editEntry?.category ?? '');
  // The entry's date is editable (tap the date row); seeded from the entry/prop.
  const [loggedDate, setLoggedDate] = useState(() => editEntry?.logged_date ?? loggedDateProp);
  const [files, setFiles] = useState<PendingFile[]>(() =>
    (editEntry?.media ?? []).map((m) => ({
      id: m.id,
      source: 'existing' as const,
      media: m,
      kind: m.kind,
      previewUrl: '',
      status: 'done' as FileUploadStatus,
    })),
  );
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { createMemory } = useCreateMemory();
  const { updateMemory } = useUpdateMemory();
  const saving = createMemory.isPending || updateMemory.isPending;

  // Resolve signed preview URLs for any existing media (external storage), once.
  useEffect(() => {
    let active = true;
    for (const m of editEntry?.media ?? []) {
      getSignedMemoryUrl(m.storage_path).then((url) => {
        if (active && url) {
          setFiles((prev) =>
            prev.map((f) => (f.id === m.id ? { ...f, previewUrl: url } : f)),
          );
        }
      });
    }
    return () => {
      active = false;
    };
  }, [editEntry]);

  // Revoke object URLs for newly-picked files when the composer unmounts.
  const filesRef = useRef<PendingFile[]>([]);
  filesRef.current = files;
  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => {
        if (f.source === 'new') URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, []);

  const hasMedia = files.length > 0;
  const current = files[Math.min(index, files.length - 1)];
  const canSave = !disabled && !saving && (note.trim().length > 0 || hasMedia);

  const dateObj = parseISO(loggedDate);
  const dateLabel = isToday(dateObj) ? 'Today' : format(dateObj, 'EEE, MMM d, yyyy');

  const handlePick = () => fileInputRef.current?.click();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (picked.length === 0) return;
    setError(null);
    const added: PendingFile[] = [];
    for (const file of picked) {
      const kind = mediaKindFromMime(file.type);
      if (!kind) continue;
      added.push({
        id: crypto.randomUUID(),
        source: 'new',
        file,
        kind,
        previewUrl: URL.createObjectURL(file),
        status: 'queued',
      });
    }
    if (added.length === 0) return;
    setFiles((prev) => {
      const next = [...prev, ...added];
      setIndex(prev.length); // jump to the first newly-added item
      return next;
    });
  };

  const removeCurrent = () => {
    setFiles((prev) => {
      const target = prev[index];
      if (target && target.source === 'new') URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((_, i) => i !== index);
      setIndex((i) => Math.max(0, Math.min(i, next.length - 1)));
      return next;
    });
  };

  const moveCurrent = (dir: -1 | 1) => {
    setFiles((prev) => {
      const swap = index + dir;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
    setIndex((i) => Math.max(0, Math.min(i + dir, files.length - 1)));
  };

  const goTo = useCallback((dir: -1 | 1) => {
    setIndex((i) => {
      const n = i + dir;
      if (n < 0 || n >= filesRef.current.length) return i;
      return n;
    });
  }, []);

  // Escape closes the editor (mirrors the viewer's keyboard handling).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, onCancel]);

  const handleSave = () => {
    if (!canSave) return;
    setError(null);
    const onSettledError = (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Could not save memory');
      setFiles((prev) =>
        prev.map((f) => (f.source === 'new' ? { ...f, status: 'queued' } : f)),
      );
    };

    if (isEditing && editEntry) {
      const items: EditMediaItem[] = files.map((f) =>
        f.source === 'existing'
          ? { type: 'existing', media: f.media }
          : { type: 'new', file: f.file },
      );
      updateMemory.mutate(
        {
          entryId: editEntry.id,
          logTypeId,
          loggedDate,
          originalDate: editEntry.logged_date,
          note,
          category,
          originalMedia: editEntry.media,
          items,
          onItemProgress: (i, status) => {
            setFiles((prev) => prev.map((f, fi) => (fi === i ? { ...f, status } : f)));
          },
        },
        {
          onSuccess: () => onSuccess?.(),
          onError: onSettledError,
        },
      );
      return;
    }

    createMemory.mutate(
      {
        logTypeId,
        loggedDate,
        note,
        category,
        files: files.flatMap((f) => (f.source === 'new' ? [f.file] : [])),
        onFileProgress: (i, status) => {
          setFiles((prev) => prev.map((f, fi) => (fi === i ? { ...f, status } : f)));
        },
      },
      {
        onSuccess: () => onSuccess?.(),
        onError: onSettledError,
      },
    );
  };

  const uniqueCategories = Array.from(new Set(existingCategories.filter(Boolean)));

  // ───────────── Stage content ─────────────
  const stageContent =
    hasMedia && current ? (
      <MediaPreview file={current} />
    ) : (
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ backgroundImage: TEXT_GRADIENT }}
      >
        {note.trim().length > 0 ? (
          <p className="max-h-[60%] overflow-y-auto whitespace-pre-wrap px-10 text-center text-xl font-medium leading-relaxed text-white/90">
            {note}
          </p>
        ) : (
          <button
            type="button"
            onClick={handlePick}
            disabled={disabled || saving}
            className="flex flex-col items-center gap-3 rounded-3xl border border-white/15 bg-white/5 px-10 py-9 backdrop-blur-sm transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/20 ring-1 ring-teal-400/40">
              <ImagePlus className="h-7 w-7 text-teal-300" />
            </span>
            <span className="text-base font-medium">Add photos or video</span>
            <span className="text-xs text-white/55">or just write a note below</span>
          </button>
        )}
      </div>
    );

  const stage = (
    <MemoryStage
      itemKey={current?.id ?? 'empty'}
      hasPrev={index > 0}
      hasNext={index < files.length - 1}
      onPrev={() => goTo(-1)}
      onNext={() => goTo(1)}
      swipeable={files.length > 1}
      animation="fade"
      chevronsOnMobile={false}
    >
      {stageContent}
    </MemoryStage>
  );

  // ───────────── Bottom block ─────────────
  const dots =
    files.length > 1 ? (
      <div className="mb-3 flex justify-center gap-1.5">
        {files.map((f, i) => (
          <span
            key={f.id}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/40',
            )}
          />
        ))}
      </div>
    ) : null;

  const dateRow = (
    <div className="mb-1 flex items-center">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-white/80 transition-colors hover:text-white disabled:opacity-50"
            aria-label="Change date"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {dateLabel}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={dateObj}
            onSelect={(d) => d && setLoggedDate(format(d, 'yyyy-MM-dd'))}
            initialFocus
            className={cn('p-3 pointer-events-auto')}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  const caption = (
    <>
      {/* Filmstrip */}
      {hasMedia && (
        <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
          {files.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                'relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-2 transition-all',
                i === index ? 'ring-teal-400' : 'ring-transparent opacity-65 hover:opacity-100',
              )}
            >
              {!f.previewUrl ? (
                <span className="flex h-full w-full items-center justify-center bg-white/10">
                  <Loader2 className="h-4 w-4 animate-spin text-white/70" />
                </span>
              ) : f.kind === 'image' ? (
                <img src={f.previewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <>
                  <video src={f.previewUrl} muted playsInline className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-4 w-4 text-white drop-shadow" />
                  </span>
                </>
              )}
              {f.status === 'uploading' && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={handlePick}
            disabled={disabled || saving}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/30 text-white/70 transition-colors hover:border-white/60 hover:text-white disabled:opacity-40"
            aria-label="Add more"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Caption */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write a caption…"
        autoComplete="off"
        rows={2}
        disabled={saving}
        className="w-full resize-none border-0 bg-transparent text-lg leading-snug text-white placeholder:italic placeholder:text-white/45 focus:outline-none"
      />

      {/* Category */}
      <div className="mt-1 flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5">
        <span className="text-sm text-teal-300">#</span>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="category"
          autoComplete="off"
          list="memory-composer-categories"
          disabled={saving}
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-white placeholder:italic placeholder:text-white/45 focus:outline-none"
        />
        <datalist id="memory-composer-categories">
          {uniqueCategories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </>
  );

  const actions: MemoryAction[] = [
    {
      key: 'add',
      icon: ImagePlus,
      label: 'Add media',
      onClick: handlePick,
      disabled: disabled || saving,
    },
    {
      key: 'remove',
      icon: Trash2,
      label: 'Remove current',
      tone: 'danger',
      onClick: removeCurrent,
      disabled: !hasMedia || saving,
    },
    {
      key: 'earlier',
      icon: ArrowLeft,
      label: 'Move earlier',
      onClick: () => moveCurrent(-1),
      disabled: !hasMedia || index === 0 || saving,
    },
    {
      key: 'later',
      icon: ArrowRight,
      label: 'Move later',
      onClick: () => moveCurrent(1),
      disabled: !hasMedia || index === files.length - 1 || saving,
    },
    {
      key: 'cancel',
      icon: X,
      label: 'Cancel',
      align: 'end',
      onClick: () => !saving && onCancel?.(),
      disabled: saving,
    },
    {
      key: 'save',
      icon: Check,
      label: 'Save',
      text: saving ? 'Saving…' : 'Save',
      align: 'end',
      prominent: true,
      onClick: handleSave,
      disabled: !canSave,
      busy: saving,
    },
  ];

  return createPortal(
    <MemoryScaffold
      stage={stage}
      dots={dots}
      dateRow={dateRow}
      caption={caption}
      actions={<MemoryActionBar actions={actions} />}
      error={error ? <p className="mt-2 text-xs text-red-300">{error}</p> : undefined}
      liftWithKeyboard
    />,
    document.body,
  );
}

/** Blurred-backdrop + object-contain framing for a single composer slide. */
function MediaPreview({ file }: { file: PendingFile }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {file.previewUrl && file.kind === 'image' && (
        <div
          aria-hidden
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-2xl"
          style={{ backgroundImage: `url(${file.previewUrl})` }}
        />
      )}
      <div className="relative flex h-full w-full items-center justify-center">
        {!file.previewUrl ? (
          <Loader2 className="h-6 w-6 animate-spin text-white/60" />
        ) : file.kind === 'image' ? (
          <img
            src={file.previewUrl}
            alt=""
            draggable={false}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <video
            src={file.previewUrl}
            controls
            playsInline
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>
    </div>
  );
}
