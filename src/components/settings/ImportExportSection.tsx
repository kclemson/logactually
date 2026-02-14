import { ArrowDownUp } from 'lucide-react';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { AppleHealthImport } from '@/components/AppleHealthImport';
import { useExportData } from '@/hooks/useExportData';

interface ImportExportSectionProps {
  showWeights: boolean;
  isReadOnly: boolean;
}

export function ImportExportSection({ showWeights, isReadOnly }: ImportExportSectionProps) {
  const { isExporting, exportFoodLog, exportWeightLog } = useExportData();

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
        {showWeights && !isReadOnly && <AppleHealthImport />}
        {isReadOnly && (
          <p className="text-xs text-muted-foreground mt-2">
            Create an account to export your data
          </p>
        )}
      </div>
    </CollapsibleSection>
  );
}
