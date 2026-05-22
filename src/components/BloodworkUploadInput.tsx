import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBloodworkPanelsForDate } from '@/hooks/useBloodworkPanels';

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
  const { uploadAndParse } = useBloodworkPanelsForDate(loggedDate);

  const handlePick = () => fileInputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await uploadAndParse.mutateAsync({ file, logTypeId });
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground shrink-0">{label}</span>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 text-sm flex-1 justify-start gap-2 border border-dashed border-border"
        onClick={handlePick}
        disabled={disabled || busy}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Reading your document…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Choose a PDF or image
          </>
        )}
      </Button>
      {onCancel && (
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onCancel} disabled={busy}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
