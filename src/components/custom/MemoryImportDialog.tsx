import { useState, useMemo, useCallback, useRef } from 'react';
import { Upload, Loader2, Check, X, Clock, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { parseMemoryFile, type ParsedPost } from '@/lib/memory-import';
import { useMemoryDays } from '@/hooks/useMemoryDays';
import { useImportMemories, type ImportItem } from '@/hooks/useImportMemories';
import { formatTag } from '@/lib/memory-media';

interface MemoryLogType {
  id: string;
  name: string;
}

interface MemoryImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Available memory-type logs the user can import into. */
  memoryLogTypes: MemoryLogType[];
}

type RowKind = 'new' | 'duplicate' | 'needs-date';

interface ReviewRow {
  post: ParsedPost;
  kind: RowKind;
  included: boolean;
}

function previewText(note: string, sourceName: string): string {
  const text = note.split('\n').map((l) => l.trim()).filter(Boolean).join(' ');
  return text || sourceName;
}

export function MemoryImportDialog({ open, onOpenChange, memoryLogTypes }: MemoryImportDialogProps) {
  const [destId, setDestId] = useState<string>(memoryLogTypes[0]?.id ?? '');
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { days } = useMemoryDays(destId || null);
  const { importAll, statuses, errors, isImporting, summary } = useImportMemories();

  // Existing date|category signatures for duplicate detection.
  const existingSignatures = useMemo(() => {
    const set = new Set<string>();
    for (const day of days) {
      for (const entry of day.entries) {
        set.add(`${entry.logged_date}|${entry.category ?? ''}`);
      }
    }
    return set;
  }, [days]);

  const classifyRows = useCallback(
    (posts: ParsedPost[]): ReviewRow[] =>
      posts.map((post) => {
        let kind: RowKind = 'new';
        if (!post.date) {
          kind = 'needs-date';
        } else if (existingSignatures.has(`${post.date}|${post.category ?? ''}`)) {
          kind = 'duplicate';
        }
        return { post, kind, included: kind === 'new' };
      }),
    [existingSignatures],
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setParseError(null);
    try {
      const parsed: ParsedPost[] = [];
      for (const file of Array.from(files)) {
        const text = await file.text();
        parsed.push(parseMemoryFile(text, file.name));
      }
      parsed.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
      setRows(classifyRows(parsed));
    } catch {
      setParseError("Could not read one or more files. Make sure they're the files you exported from the other platform.");
    }
  };

  const toggleRow = (sourceName: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.post.sourceName === sourceName && r.kind !== 'needs-date'
          ? { ...r, included: !r.included }
          : r,
      ),
    );
  };

  const selectableRows = rows.filter((r) => r.kind !== 'needs-date');
  const allSelected = selectableRows.length > 0 && selectableRows.every((r) => r.included);
  const toggleAll = () => {
    const next = !allSelected;
    setRows((prev) => prev.map((r) => (r.kind === 'needs-date' ? r : { ...r, included: next })));
  };

  const includedCount = rows.filter((r) => r.included).length;

  const handleImport = () => {
    const items: ImportItem[] = rows
      .filter((r) => r.included && r.post.date)
      .map((r) => ({
        id: r.post.sourceName,
        logTypeId: destId,
        loggedDate: r.post.date as string,
        note: r.post.note || null,
        category: r.post.category,
        images: r.post.images,
      }));
    importAll(items);
  };

  const renderStatus = (row: ReviewRow) => {
    const live = statuses[row.post.sourceName];
    if (live === 'importing') {
      return <span className="inline-flex items-center gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Importing</span>;
    }
    if (live === 'done') {
      return <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><Check className="h-3 w-3" /> Imported</span>;
    }
    if (live === 'failed') {
      return <span className="inline-flex items-center gap-1 text-destructive" title={errors[row.post.sourceName]}><X className="h-3 w-3" /> Failed</span>;
    }
    if (row.kind === 'needs-date') {
      return <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"><Clock className="h-3 w-3" /> Needs date</span>;
    }
    if (row.kind === 'duplicate') {
      return <span className="text-muted-foreground">Already imported</span>;
    }
    return <span className="text-foreground/70">New</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] top-[5%] translate-y-0 max-h-[85vh] max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import to photo scrapbook</DialogTitle>
          <DialogDescription>
            Have content exported from another platform (like a blog or newsletter)? Upload the
            exported files here and we'll pull in the posts and photos. Review the list, then import
            them all at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {memoryLogTypes.length > 1 && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Import into</label>
              <Select value={destId} onValueChange={setDestId} disabled={isImporting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {memoryLogTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,text/html"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {rows.length > 0 ? 'Choose different files' : 'Choose files'}
            </Button>
            {parseError && <p className="text-xs text-destructive mt-2">{parseError}</p>}
          </div>

          {rows.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={isImporting || selectableRows.length === 0}
                    />
                  </TableHead>
                  <TableHead>Post</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="text-right">Words</TableHead>
                  <TableHead className="text-right">Photos</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.post.sourceName}>
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Include ${row.post.sourceName}`}
                        checked={row.included}
                        onChange={() => toggleRow(row.post.sourceName)}
                        disabled={isImporting || row.kind === 'needs-date'}
                      />
                    </TableCell>
                    <TableCell className="max-w-[16rem]">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{previewText(row.post.note, row.post.sourceName)}</span>
                      </span>
                      {row.post.category && (
                        <span className="text-[10px] text-muted-foreground">{formatTag(row.post.category)}</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-xs">
                      {row.post.date ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{row.post.wordCount}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{row.post.images.length}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{renderStatus(row)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {summary && (
            <p className="text-sm">
              Imported {summary.imported} {summary.imported === 1 ? 'post' : 'posts'}
              {summary.failed > 0 && `, ${summary.failed} failed`}.
            </p>
          )}

          {rows.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isImporting}>
                {summary ? 'Done' : 'Cancel'}
              </Button>
              {!summary && (
                <Button onClick={handleImport} disabled={isImporting || includedCount === 0 || !destId}>
                  {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Import {includedCount > 0 ? `(${includedCount})` : ''}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
