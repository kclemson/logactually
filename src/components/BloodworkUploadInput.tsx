import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Loader2, CheckCircle2 } from 'lucide-react';
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

export function BloodworkUploadInput({ label, logTypeId, loggedDate, onSuccess, onCancel, disabled }: BloodworkUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<BloodworkPanel | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [savedTo, setSavedTo] = useState<string | null>(null);
  const { uploadAndParse } = useBloodworkPanelsForDate(loggedDate);
  const navigate = useNavigate();

  const handlePick = () => fileInputRef.current?.click();

  const runUpload = async (file: File, opts?: { skipDupCheck?: boolean }) => {
    setBusy(true);
    setError(null);
    setSavedTo(null);
    try {
      // If skipping dup check (user chose "Upload anyway"), we patch the hash check
      // by temporarily setting a unique marker — simplest path is to just retry and
      // accept that uniqueness index will reject; instead we set a sentinel hash.
      const result = await uploadAndParse.mutateAsync({ file, logTypeId });
      const extracted = result.extractedDate;
      if (extracted && extracted !== loggedDate) {
        setSavedTo(extracted);
      } else if (!extracted) {
        setSavedTo('__no_date__');
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
    // Re-tag the file with a sentinel byte to force a unique hash. We append a single
    // random byte so the upload bypasses the bytes-hash check without altering the
    // visible document. (Same labs → Layer 2 will still catch as content duplicate.)
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
    if (panel.collected_date) navigate(`/other?date=${panel.collected_date}`);
  };

  const handleViewSaved = () => {
    if (savedTo && savedTo !== '__no_date__') {
      navigate(`/other?date=${savedTo}`);
    }
    setSavedTo(null);
    onSuccess?.();
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground shrink-0">{label}</span>
        <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFile} />
        <Button
          type="button" variant="ghost" size="sm"
          className="h-8 text-sm flex-1 justify-start gap-2 border border-dashed border-border"
          onClick={handlePick} disabled={disabled || busy}
        >
          {busy ? (<><Loader2 className="h-4 w-4 animate-spin" />Reading your document…</>) : (<><Upload className="h-4 w-4" />Choose a PDF or image</>)}
        </Button>
        {onCancel && (
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onCancel} disabled={busy}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive pl-1">{error}</p>}
      {savedTo && savedTo !== '__no_date__' && (
        <button
          onClick={handleViewSaved}
          className="text-xs text-muted-foreground pl-1 inline-flex items-center gap-1 hover:text-foreground"
        >
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          Saved to {format(new Date(savedTo), 'MMM d, yyyy')} · view
        </button>
      )}
      {savedTo === '__no_date__' && (
        <p className="text-xs text-muted-foreground pl-1">
          Saved, but no collection date was found in the document.
        </p>
      )}
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
