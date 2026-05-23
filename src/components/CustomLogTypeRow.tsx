import { useState } from 'react';
import { RotateCw, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { CustomLogType } from '@/hooks/useCustomLogTypes';
import { SavedItemRow } from '@/components/SavedItemRow';
import { EditLogTypeDialog } from '@/components/EditLogTypeDialog';
import { getMedicationMeta } from '@/lib/medication-meta';
import { useFailedBloodworkPanels } from '@/hooks/useBloodworkPanels';

interface CustomLogTypeRowProps {
  type: CustomLogType;
  onRename: (id: string, name: string) => void;
  onUpdateUnit: (id: string, unit: string | null) => void;
  onUpdateDescription: (id: string, description: string | null) => void;
  onUpdateMedication?: (id: string, params: { description?: string | null; unit?: string | null; default_dose?: number | null; doses_per_day?: number; dose_times?: string[] | null }) => void;
  onDelete: (id: string) => void;
  openDeletePopoverId: string | null;
  setOpenDeletePopoverId: (id: string | null) => void;
  existingNames?: string[];
}

export function CustomLogTypeRow({
  type,
  onRename,
  onUpdateUnit,
  onUpdateDescription,
  onUpdateMedication,
  onDelete,
  openDeletePopoverId,
  setOpenDeletePopoverId,
  existingNames = [],
}: CustomLogTypeRowProps) {
  const [editOpen, setEditOpen] = useState(false);

  // For medication: show dose · freq as meta (right of name, left of icons)
  const meta = getMedicationMeta(type) ?? undefined;

  // For non-medication: show unit in parens after name
  const nameAppend = type.value_type !== 'medication' && type.unit
    ? `(${type.unit})`
    : null;

  const isPanel = type.value_type === 'panel';
  const { failedPanels, retryParse, deletePanel } = useFailedBloodworkPanels(isPanel ? type.id : undefined);

  return (
    <>
      <SavedItemRow
        id={type.id}
        name={type.name}
        onUpdateName={(newName) => onRename(type.id, newName)}
        onDelete={() => onDelete(type.id)}
        onEdit={() => setEditOpen(true)}
        deleteConfirmLabel="Delete log type?"
        deleteConfirmDescription={`"${type.name}" and all its entries will be permanently removed.`}
        openDeletePopoverId={openDeletePopoverId}
        setOpenDeletePopoverId={setOpenDeletePopoverId}
        expandable={false}
        nameAppend={nameAppend}
        meta={meta}
        existingNames={existingNames}
      />
      {isPanel && failedPanels.length > 0 && (
        <ul className="ml-4 mb-1 space-y-1 border-l border-border/40 pl-3">
          {failedPanels.map((p) => {
            const retrying = retryParse.isPending && retryParse.variables === p.id;
            return (
              <li key={p.id} className="flex items-start gap-2 py-1 text-xs">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-foreground">{p.source_filename ?? 'Untitled upload'}</span>
                    <span className="text-muted-foreground shrink-0">{format(parseISO(p.created_at), 'MMM d')}</span>
                  </div>
                  {p.parse_error && (
                    <div className="text-muted-foreground line-clamp-2">{p.parse_error}</div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Retry parse"
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  disabled={retrying}
                  onClick={() => retryParse.mutate(p.id)}
                >
                  {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  aria-label="Delete failed upload"
                  className="p-1 text-muted-foreground hover:text-destructive"
                  onClick={() => deletePanel.mutate(p.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {editOpen && (
        <EditLogTypeDialog
          logType={type}
          open={editOpen}
          onOpenChange={setEditOpen}
          existingNames={existingNames.filter(n => n !== type.name)}
          onSave={(id, params) => {
            if (type.value_type === 'medication' && onUpdateMedication) {
              onUpdateMedication(id, params);
            } else {
              if (params.name && params.name !== type.name) onRename(id, params.name);
              onUpdateDescription(id, params.description);
              if (params.unit !== undefined) onUpdateUnit(id, params.unit);
            }
          }}
        />
      )}
    </>
  );
}
