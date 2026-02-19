import { useState } from 'react';
import type { CustomLogType } from '@/hooks/useCustomLogTypes';
import { SavedItemRow } from '@/components/SavedItemRow';
import { EditLogTypeDialog } from '@/components/EditLogTypeDialog';

interface CustomLogTypeRowProps {
  type: CustomLogType;
  onRename: (id: string, name: string) => void;
  onUpdateUnit: (id: string, unit: string | null) => void;
  onUpdateDescription: (id: string, description: string | null) => void;
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
  onDelete,
  openDeletePopoverId,
  setOpenDeletePopoverId,
  existingNames = [],
}: CustomLogTypeRowProps) {
  const [editOpen, setEditOpen] = useState(false);

  const unitAppend = type.unit ? `(${type.unit})` : null;

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
        nameAppend={unitAppend}
        existingNames={existingNames}
      />
      {editOpen && (
        <EditLogTypeDialog
          logType={type}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSave={(id, description) => onUpdateDescription(id, description)}
        />
      )}
    </>
  );
}
