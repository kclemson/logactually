import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBloodworkPanelsForDate, DuplicateFileError, type BloodworkPanel } from '@/hooks/useBloodworkPanels';
import { DuplicateBlockedDialog } from '@/components/DuplicateBlockedDialog';

interface BloodworkUploadInputProps {
  label: string;
  logTypeId: string;
  loggedDate: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

type SectionSummary = { title: string; count: number };
type SavedState = {
  date: string | null;
  sections: SectionSummary[];
  resultCount: number;
  filename: string;
};

export function BloodworkUploadInput({ label, logTypeId, loggedDate, onSuccess, onCancel, disabled }: BloodworkUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<BloodworkPanel | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saved, setSaved] = useState<SavedState | null>(null);
  const { uploadAndParse } = useBloodworkPanelsForDate(loggedDate);
  const navigate = useNavigate();

  const handlePick = () => fileInputRef.current?.click();

  const runUpload = async (file: File, opts?: { skipDupCheck?: boolean }) => {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const result = await uploadAndParse.mutateAsync({ file, logTypeId });
      const extracted = result.extractedDate;
      const summary: SavedState = {
        date: extracted ?? null,
        sections: result.sections,
        resultCount: result.resultCount,
        filename: result.filename,
      };
      if (extracted && extracted !== loggedDate) {
        setSaved(summary);
      } else if (!extracted) {
        setSaved(summary);
      } else {
        onSuccess?.();
      }
    } catch (err: unknown) {
      if (err instanceof DuplicateFileError && !opts?.skipDupCheck) {
        setDuplicate(err.existingPanel);
        setPendingFile(file);
        return;
      }
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await runUpload(file);
  };

  const handleUploadAnyway = async () => {
    if (!pendingFile) return;
    const file = pendingFile;
    setDuplicate(null);
    setPendingFile(null);
    const tagged = new File(
      [file, new Uint8Array([Math.floor(Math.random() * 256)])],
      file.name,
      { type: file.type },
    );
    await runUpload(tagged, { skipDupCheck: true });
  };

  const handleViewExisting = (panel: BloodworkPanel) => {
    setDuplicate(null);
    setPendingFile(null);
    if (panel.collected_date) navigate(`/custom?date=${panel.collected_date}`);
  };

  const handleViewSaved = () => {
    if (saved?.date) navigate(`/custom?date=${saved.date}`);
    setSaved(null);
    onSuccess?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {onCancel && (
          <Button type="button" size="icon" variant="ghost" className="h-7 w-7 -mr-1.5" onClick={onCancel} disabled={busy}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFile} />

      {!saved && (
        <button
          type="button"
          onClick={handlePick}
          disabled={disabled || busy}
          className="w-full rounded-lg border-2 border-dashed border-border hover:border-foreground/30 hover:bg-muted/30 transition-colors py-8 px-4 flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
              <span className="text-sm text-foreground font-medium">Reading your document…</span>
              <span className="text-xs text-muted-foreground">This usually takes a few seconds</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-foreground font-medium">Choose a PDF or image</span>
              <span className="text-xs text-muted-foreground">PDF or image, up to 20MB</span>
            </>
          )}
        </button>
      )}

      {saved && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm font-medium text-foreground">
                {saved.date ? format(new Date(saved.date), 'MMM d, yyyy') : 'No collection date found in document'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground pl-6 truncate" title={saved.filename}>
              {saved.filename}
            </div>
            {saved.resultCount > 0 && (
              <div className="text-xs text-muted-foreground pl-6">
                {saved.resultCount} result{saved.resultCount === 1 ? '' : 's'}
                {saved.sections.length > 0 && (
                  <> across {saved.sections.length} panel{saved.sections.length === 1 ? '' : 's'}</>
                )}
              </div>
            )}
          </div>

          {saved.sections.length > 0 && (
            <ul className="space-y-1 pl-6">
              {saved.sections.map((s) => (
                <li key={s.title} className="text-xs flex items-baseline gap-2">
                  <span className="text-muted-foreground">·</span>
                  <span className="text-foreground/80 flex-1">{s.title}</span>
                  <span className="text-muted-foreground tabular-nums">{s.count}</span>
                </li>
              ))}
            </ul>
          )}

          {saved.date && (
            <div className="flex justify-end pt-1">
              <Button
                type="button" size="sm" variant="default"
                className="h-9 gap-1.5"
                onClick={handleViewSaved}
              >
                View <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}

      <DuplicateBlockedDialog
        open={!!duplicate}
        existing={duplicate}
        onCancel={() => { setDuplicate(null); setPendingFile(null); }}
        onUploadAnyway={handleUploadAnyway}
        onViewExisting={handleViewExisting}
      />
    </div>
  );
}
