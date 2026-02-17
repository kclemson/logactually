import type { CustomLogType } from '@/hooks/useCustomLogTypes';
import { SavedItemRow } from '@/components/SavedItemRow';

const VALUE_TYPE_LABELS: Record<string, string> = {
  numeric: 'numeric',
  text_numeric: 'text + numeric',
  text: 'text (single line)',
  text_multiline: 'text (multi line)',
};

interface CustomLogTypeRowProps {
  type: CustomLogType;
  onRename: (id: string, name: string) => void;
  onUpdateUnit: (id: string, unit: string | null) => void;
  onDelete: (id: string) => void;
  openDeletePopoverId: string | null;
  setOpenDeletePopoverId: (id: string | null) => void;
  existingNames?: string[];
}

export function CustomLogTypeRow({
  type,
  onRename,
  onUpdateUnit,
  onDelete,
  openDeletePopoverId,
  setOpenDeletePopoverId,
  existingNames = [],
}: CustomLogTypeRowProps) {
  const metaContent = (
    <>
      {type.unit && <span>({type.unit}) </span>}
      {VALUE_TYPE_LABELS[type.value_type] || type.value_type}
    </>
  );

  return (
    <SavedItemRow
      id={type.id}
      name={type.name}
      onUpdateName={(newName) => onRename(type.id, newName)}
      onDelete={() => onDelete(type.id)}
      deleteConfirmLabel="Delete log type?"
      deleteConfirmDescription={`"${type.name}" and all its entries will be permanently removed.`}
      openDeletePopoverId={openDeletePopoverId}
      setOpenDeletePopoverId={setOpenDeletePopoverId}
      expandable={false}
      meta={metaContent}
      existingNames={existingNames}
    />
  );
}
