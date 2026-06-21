import { useRef, useState, useEffect } from 'react';
import { X, ImagePlus, Loader2, Play, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateMemory, type FileUploadStatus } from '@/hooks/useMemoryMedia';
import { mediaKindFromMime, type MediaKind } from '@/lib/memory-media';
import { cn } from '@/lib/utils';

interface MemoryEntryInputProps {
  label: string;
  logTypeId: string;
  loggedDate: string;
  existingCategories?: string[];
  onSuccess?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

interface PendingFile {
  id: string;
  file: File;
  kind: MediaKind;
  previewUrl: string;
  status: FileUploadStatus;
}

export function MemoryEntryInput({
  label,
  logTypeId,
  loggedDate,
  existingCategories = [],
  onSuccess,
  onCancel,
  disabled,
}: MemoryEntryInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { createMemory } = useCreateMemory();
  const saving = createMemory.isPending;

  // Revoke all object URLs when the composer unmounts.
  const filesRef = useRef<PendingFile[]>([]);
  filesRef.current = files;
  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, []);

  const canSave = !disabled && !saving && (note.trim().length > 0 || files.length > 0);

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
        file,
        kind,
        previewUrl: URL.createObjectURL(file),
        status: 'queued',
      });
    }
    setFiles((prev) => [...prev, ...added]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const moveFile = (id: string, dir: -1 | 1) => {
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const handleSave = () => {
    if (!canSave) return;
    setError(null);
    createMemory.mutate(
      {
        logTypeId,
        loggedDate,
        note: note,
        category: category,
        files: files.map((f) => f.file),
        onFileProgress: (index, status) => {
          setFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, status } : f)),
          );
        },
      },
      {
        onSuccess: () => onSuccess?.(),
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Could not save memory');
          setFiles((prev) => prev.map((f) => ({ ...f, status: 'queued' })));
        },
      },
    );
  };

  const uniqueCategories = Array.from(new Set(existingCategories.filter(Boolean)));

  return (
    <div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-3 max-h-[90vh] max-h-[90dvh] overflow-hidden">
      <div className="shrink-0 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {onCancel && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 -mr-1.5"
            onClick={onCancel}
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto flex flex-col gap-3">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write a note… (optional)"
          autoComplete="off"
          rows={3}
          className="resize-none placeholder:text-foreground/50 placeholder:italic"
          disabled={saving}
        />

        <div>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (optional)"
            autoComplete="off"
            list="memory-categories"
            disabled={saving}
            className="w-full h-9 px-3 text-sm rounded-md border border-border bg-background placeholder:text-foreground/50 placeholder:italic focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          <datalist id="memory-categories">
            {uniqueCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {files.map((f, idx) => (
              <div
                key={f.id}
                className="relative aspect-square rounded-md overflow-hidden border border-border bg-muted group"
              >
                {f.kind === 'image' ? (
                  <img src={f.previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <video src={f.previewUrl} className="h-full w-full object-cover" muted playsInline />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Play className="h-6 w-6 text-white drop-shadow" />
                    </div>
                  </>
                )}

                {f.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}

                {!saving && (
                  <>
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => moveFile(f.id, -1)}
                        disabled={idx === 0}
                        className="h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30"
                        aria-label="Move left"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFile(f.id, 1)}
                        disabled={idx === files.length - 1}
                        className="h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30"
                        aria-label="Move right"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handlePick}
          disabled={disabled || saving}
          className="shrink-0 w-full rounded-lg border-2 border-dashed border-border hover:border-foreground/30 hover:bg-muted/30 transition-colors py-4 px-3 flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ImagePlus className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground font-medium">
            {files.length > 0 ? 'Add more photos or videos' : 'Add photos or videos'}
          </span>
          <span className="text-xs text-muted-foreground">Add as many as you like</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </div>

      {error && <p className="shrink-0 text-xs text-destructive">{error}</p>}

      <div className="shrink-0 flex justify-end gap-2">
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={!canSave}
          className={cn('bg-teal-500 text-white hover:bg-teal-600')}
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              Saving…
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </div>
  );
}
