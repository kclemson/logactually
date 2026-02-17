import { useState, useCallback } from 'react';

export interface EditingCell<TField extends string> {
  index: number;
  field: TField;
  value: string | number;
  originalValue: string | number;
}

interface UseInlineEditOptions<TField extends string> {
  /** Called when a numeric field is committed (Enter or blur). Caller handles validation and domain logic. */
  onSaveNumeric?: (index: number, field: TField, value: number) => void;
  /** Blocks all saves and shows overlay */
  isReadOnly: boolean;
  triggerOverlay: () => void;
}

interface UseInlineEditReturn<TField extends string> {
  editingCell: EditingCell<TField> | null;
  startEditing: (index: number, field: TField, displayValue: number) => void;
  updateEditingValue: (rawString: string, parser?: (s: string) => number) => void;
  handleNumericKeyDown: (e: React.KeyboardEvent) => void;
  handleNumericBlur: () => void;
}

export function useInlineEdit<TField extends string>(
  options: UseInlineEditOptions<TField>
): UseInlineEditReturn<TField> {
  const { onSaveNumeric, isReadOnly, triggerOverlay } = options;
  const [editingCell, setEditingCell] = useState<EditingCell<TField> | null>(null);

  const startEditing = useCallback((index: number, field: TField, displayValue: number) => {
    setEditingCell({ index, field, value: displayValue, originalValue: displayValue });
  }, []);

  const updateEditingValue = useCallback((rawString: string, parser: (s: string) => number = (s) => parseInt(s, 10)) => {
    setEditingCell(prev => {
      if (!prev) return prev;
      return { ...prev, value: rawString === '' ? '' : parser(rawString) || 0 };
    });
  }, []);

  /** Try to commit the current numeric edit. */
  const commitNumeric = useCallback(() => {
    if (!editingCell) return;
    if (isReadOnly) {
      triggerOverlay();
      setEditingCell(null);
      return;
    }
    if (editingCell.value !== editingCell.originalValue && editingCell.value !== '') {
      onSaveNumeric?.(editingCell.index, editingCell.field as TField, Number(editingCell.value));
    }
    setEditingCell(null);
  }, [editingCell, isReadOnly, triggerOverlay, onSaveNumeric]);

  const handleNumericKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitNumeric();
      (e.target as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCell(null);
      (e.target as HTMLElement).blur();
    }
  }, [commitNumeric]);

  const handleNumericBlur = useCallback(() => {
    if (!editingCell) return;
    if (!isReadOnly && editingCell.value !== editingCell.originalValue && editingCell.value !== '') {
      onSaveNumeric?.(editingCell.index, editingCell.field as TField, Number(editingCell.value));
    }
    setEditingCell(null);
  }, [editingCell, isReadOnly, onSaveNumeric]);

  return {
    editingCell,
    startEditing,
    updateEditingValue,
    handleNumericKeyDown,
    handleNumericBlur,
  };
}
