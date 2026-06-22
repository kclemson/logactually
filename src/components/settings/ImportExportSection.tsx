import { useState } from 'react';
import { ArrowDownUp, Upload, Download } from 'lucide-react';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { AppleHealthImport } from '@/components/AppleHealthImport';
import { MemoryImportDialog } from '@/components/custom/MemoryImportDialog';
import { useExportData } from '@/hooks/useExportData';

interface ImportExportSectionProps {
  showWeights: boolean;
  showCustomLogs: boolean;
  hasCustomLogTypes: boolean;
  hasBloodworkLogType: boolean;
  memoryLogTypes: { id: string; name: string }[];
  isReadOnly: boolean;
}

export function ImportExportSection({ showWeights, showCustomLogs, hasCustomLogTypes, hasBloodworkLogType, memoryLogTypes, isReadOnly }: ImportExportSectionProps) {
  const { isExporting, exportFoodLog, exportWeightLog, exportCustomLog, exportBloodwork, exportBloodworkFiles, exportScrapbook } = useExportData();
  const [memoryImportOpen, setMemoryImportOpen] = useState(false);

  const hasScrapbooks = showCustomLogs && memoryLogTypes.length > 0;
  const canImportMemories = hasScrapbooks && !isReadOnly;

  return (
    <CollapsibleSection title="Import and Export" icon={ArrowDownUp} storageKey="settings-export" iconClassName="text-zinc-500 dark:text-zinc-400">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Export food logs to CSV</p>
          <button
            onClick={exportFoodLog}
            disabled={isExporting || isReadOnly}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            Daily Food Log
          </button>
        </div>
        {showWeights && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Export exercise logs to CSV</p>
            <button
              onClick={exportWeightLog}
              disabled={isExporting || isReadOnly}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              Daily Exercise Log
            </button>
          </div>
        )}
        {showCustomLogs && hasCustomLogTypes && !isReadOnly && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Export custom logs to CSV</p>
            <button
              onClick={exportCustomLog}
              disabled={isExporting}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              Custom Logs
            </button>
          </div>
        )}
        {hasBloodworkLogType && !isReadOnly && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Export bloodwork results to CSV</p>
              <button
                onClick={exportBloodwork}
                disabled={isExporting}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                Bloodwork
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Download original bloodwork files</p>
              <button
                onClick={exportBloodworkFiles}
                disabled={isExporting}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                Bloodwork Files (zip)
              </button>
            </div>
          </>
        )}
        {canImportMemories && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Import to photo scrapbook</p>
            <button
              onClick={() => setMemoryImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              Import to Scrapbook
            </button>
          </div>
        )}
        {showWeights && !isReadOnly && <AppleHealthImport />}
        {isReadOnly && (
          <p className="text-xs text-muted-foreground mt-2">
            Create an account to export your data
          </p>
        )}
      </div>
      {memoryImportOpen && (
        <MemoryImportDialog
          open
          onOpenChange={setMemoryImportOpen}
          memoryLogTypes={memoryLogTypes}
        />
      )}
    </CollapsibleSection>
  );
}
