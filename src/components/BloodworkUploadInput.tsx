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

type SavedState = { date: string | null; sections: string[] };

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
      const sections = result.sections ?? [];
      if (extracted && extracted !== loggedDate) {
        setSaved({ date: extracted, sections });
      } else if (!extracted) {
        setSaved({ date: null, sections });
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
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground shrink-0">{label}</span>
        <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFile} />
        {!saved && (
          <Button
            type="button" variant="ghost" size="sm"
            className="h-8 text-sm flex-1 justify-start gap-2 border border-dashed border-border"
            onClick={handlePick} disabled={disabled || busy}
          >
            {busy ? (<><Loader2 className="h-4 w-4 animate-spin" />Reading your document…</>) : (<><Upload className="h-4 w-4" />Choose a PDF or image</>)}
          </Button>
        )}
        {saved && (
          <div className="flex-1 flex items-start gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground">
                {saved.date
                  ? `Saved to ${format(new Date(saved.date), 'MMM d, yyyy')}`
                  : 'Saved — no collection date found in the document'}
              </div>
              {saved.sections.length > 0 && (
                <div className="text-xs text-muted-foreground truncate" title={saved.sections.join(' · ')}>
                  {saved.sections.join(' · ')}
                </div>
              )}
            </div>
            {saved.date && (
              <Button
                type="button" size="sm" variant="default"
                className="h-7 px-2.5 gap-1 shrink-0"
                onClick={handleViewSaved}
              >
                View <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
        {onCancel && (
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onCancel} disabled={busy}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive pl-1">{error}</p>}
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
