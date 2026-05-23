import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Loader2, CheckCircle2, ArrowRight, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBloodworkPanelsForDate, DuplicateFileError, type BloodworkPanel } from '@/hooks/useBloodworkPanels';

interface BloodworkUploadInputProps {
  label: string;
  logTypeId: string;
  loggedDate: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

type SectionSummary = { title: string; count: number };
type JobResult = {
  date: string | null;
  sections: SectionSummary[];
  resultCount: number;
};
type FileJob = {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'done' | 'error' | 'duplicate';
  result?: JobResult;
  error?: string;
  duplicate?: BloodworkPanel;
};

const CONCURRENCY = 3;

export function BloodworkUploadInput({ label, logTypeId, loggedDate, onSuccess, onCancel, disabled }: BloodworkUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<FileJob[]>([]);
  const { uploadAndParse } = useBloodworkPanelsForDate(loggedDate);
  const navigate = useNavigate();

  const inFlight = jobs.some((j) => j.status === 'queued' || j.status === 'uploading');
  const hasJobs = jobs.length > 0;

  const updateJob = (id: string, patch: Partial<FileJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  };

  const runJob = async (job: FileJob, fileOverride?: File, skipDupCheck = false) => {
    updateJob(job.id, { status: 'uploading', error: undefined, duplicate: undefined });
    try {
      const file = fileOverride ?? job.file;
      const result = await uploadAndParse.mutateAsync({ file, logTypeId });
      updateJob(job.id, {
        status: 'done',
        result: {
          date: result.extractedDate ?? null,
          sections: result.sections,
          resultCount: result.resultCount,
        },
      });
    } catch (err: unknown) {
      if (err instanceof DuplicateFileError && !skipDupCheck) {
        updateJob(job.id, { status: 'duplicate', duplicate: err.existingPanel });
        return;
      }
      const msg = err instanceof Error ? err.message : 'Upload failed';
      updateJob(job.id, { status: 'error', error: msg });
    }
  };

  const runBatch = async (newJobs: FileJob[]) => {
    let cursor = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, newJobs.length) }, async () => {
      while (cursor < newJobs.length) {
        const idx = cursor++;
        await runJob(newJobs[idx]);
      }
    });
    await Promise.all(workers);
  };

  const handlePick = () => fileInputRef.current?.click();

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (picked.length === 0) return;
    const newJobs: FileJob[] = picked.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'queued',
    }));
    setJobs((prev) => [...prev, ...newJobs]);
    await runBatch(newJobs);
  };

  const handleUploadAnyway = async (job: FileJob) => {
    const tagged = new File(
      [job.file, new Uint8Array([Math.floor(Math.random() * 256)])],
      job.file.name,
      { type: job.file.type },
    );
    await runJob(job, tagged, true);
  };

  const handleRetry = async (job: FileJob) => {
    await runJob(job);
  };

  const handleViewExisting = (panel: BloodworkPanel) => {
    if (panel.collected_date) {
      try { localStorage.setItem('custom-log-view-mode', 'date'); } catch {}
      navigate(`/custom?date=${panel.collected_date}`);
      onSuccess?.();
    }
  };

  const handleViewDate = (date: string) => {
    try { localStorage.setItem('custom-log-view-mode', 'date'); } catch {}
    navigate(`/custom?date=${date}`);
    onSuccess?.();
  };

  const handleDone = () => {
    setJobs([]);
    onSuccess?.();
  };

  return (
    <div className="flex flex-col gap-3 min-h-0 min-w-0 w-full max-h-[85vh] max-h-[85dvh]">
      <div className="shrink-0 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {onCancel && (
          <Button type="button" size="icon" variant="ghost" className="h-7 w-7 -mr-1.5" onClick={onCancel} disabled={inFlight}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      <button
        type="button"
        onClick={handlePick}
        disabled={disabled || inFlight}
        className="shrink-0 w-full rounded-lg border-2 border-dashed border-border hover:border-foreground/30 hover:bg-muted/30 transition-colors py-4 sm:py-6 px-3 sm:px-4 flex flex-col items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {inFlight ? (
          <>
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            <span className="text-sm text-foreground font-medium">Reading your documents…</span>
            
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-foreground font-medium">
              {hasJobs ? 'Add more PDFs or images' : 'Choose PDFs or images'}
            </span>
            <span className="text-xs text-muted-foreground">PDF or image, up to 20MB each</span>
          </>
        )}
      </button>

      {hasJobs && (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-muted/30 divide-y divide-border/60">
          {jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              loggedDate={loggedDate}
              onUploadAnyway={() => handleUploadAnyway(job)}
              onRetry={() => handleRetry(job)}
              onViewExisting={handleViewExisting}
              onViewDate={handleViewDate}
            />
          ))}
        </div>
      )}

      {hasJobs && (
        <div className="shrink-0 flex justify-end">
          <Button type="button" size="sm" onClick={handleDone} disabled={inFlight}>
            Done
          </Button>
        </div>
      )}
    </div>
  );
}

interface JobRowProps {
  job: FileJob;
  loggedDate: string;
  onUploadAnyway: () => void;
  onRetry: () => void;
  onViewExisting: (panel: BloodworkPanel) => void;
  onViewDate: (date: string) => void;
}

function JobRow({ job, loggedDate, onUploadAnyway, onRetry, onViewExisting, onViewDate }: JobRowProps) {
  const icon = (() => {
    switch (job.status) {
      case 'queued':
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'duplicate':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  })();

  const dateMismatch =
    job.status === 'done' && job.result?.date && job.result.date !== loggedDate;

  return (
    <div className="px-3 py-2 flex items-start gap-2 text-xs min-w-0">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-foreground font-medium truncate min-w-0 flex-1" title={job.file.name}>
            {job.file.name}
          </span>
          {job.status === 'done' && job.result?.date && (
            <span className="text-muted-foreground tabular-nums shrink-0">
              {format(new Date(job.result.date), 'MMM d, yyyy')}
            </span>
          )}
        </div>

        {job.status === 'uploading' && (
          <div className="text-muted-foreground">Reading & parsing…</div>
        )}
        {job.status === 'queued' && (
          <div className="text-muted-foreground">Queued</div>
        )}

        {job.status === 'done' && job.result && (
          <div className="text-muted-foreground">
            {job.result.resultCount > 0 ? (
              <>
                {job.result.resultCount} result{job.result.resultCount === 1 ? '' : 's'}
                {job.result.sections.length > 0 && (
                  <> · {job.result.sections.length} panel{job.result.sections.length === 1 ? '' : 's'}</>
                )}
              </>
            ) : (
              <>No results found</>
            )}
            {!job.result.date && <> · no collection date</>}
          </div>
        )}

        {job.status === 'duplicate' && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-amber-700 dark:text-amber-500">Already uploaded</span>
            {job.duplicate && (
              <button
                type="button"
                onClick={() => onViewExisting(job.duplicate!)}
                className="text-foreground/80 hover:text-foreground underline-offset-2 hover:underline inline-flex items-center gap-0.5"
              >
                View existing <ExternalLink className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={onUploadAnyway}
              className="text-foreground/80 hover:text-foreground underline-offset-2 hover:underline"
            >
              Upload anyway
            </button>
          </div>
        )}

        {job.status === 'error' && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-destructive">{job.error ?? 'Upload failed'}</span>
            <button
              type="button"
              onClick={onRetry}
              className="text-foreground/80 hover:text-foreground underline-offset-2 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {dateMismatch && job.result?.date && (
          <button
            type="button"
            onClick={() => onViewDate(job.result!.date!)}
            className="text-foreground/80 hover:text-foreground underline-offset-2 hover:underline inline-flex items-center gap-0.5"
          >
            View <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
