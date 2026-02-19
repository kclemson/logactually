import { useState } from 'react';
import type { CustomLogType } from '@/hooks/useCustomLogTypes';
import { SavedItemRow } from '@/components/SavedItemRow';
import { EditLogTypeDialog } from '@/components/EditLogTypeDialog';

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
  const meta = type.value_type === 'medication' ? (() => {
    const dosePart = type.default_dose != null && type.unit
      ? `${type.default_dose} ${type.unit}`
      : type.unit || null;
    const freqPart = type.doses_per_day > 0 ? `${type.doses_per_day}x/day` : 'as needed';
    return dosePart ? `${dosePart} · ${freqPart}` : freqPart;
  })() : undefined;

  // For non-medication: show unit in parens after name
  const nameAppend = type.value_type !== 'medication' && type.unit
    ? `(${type.unit})`
    : null;

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
