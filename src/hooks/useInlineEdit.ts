import { useState, useRef, useCallback } from 'react';

export interface EditingCell<TField extends string> {
  index: number;
  field: TField;
  value: string | number;
  originalValue: string | number;
}

interface UseInlineEditOptions<TField extends string> {
  /** Called when a numeric field is committed (Enter or blur). Caller handles validation and domain logic. */
  onSaveNumeric?: (index: number, field: TField, value: number) => void;
  /** Called when description is committed (Enter or blur). Caller handles side effects. */
  onSaveDescription?: (index: number, newDescription: string) => void;
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
  getDescriptionEditProps: (index: number, description: string) => {
    onFocus: (e: React.FocusEvent<HTMLSpanElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLSpanElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLSpanElement>) => void;
  };
}

export function useInlineEdit<TField extends string>(
  options: UseInlineEditOptions<TField>
): UseInlineEditReturn<TField> {
  const { onSaveNumeric, onSaveDescription, isReadOnly, triggerOverlay } = options;
  const [editingCell, setEditingCell] = useState<EditingCell<TField> | null>(null);
  const descriptionOriginalRef = useRef<string>('');

  const startEditing = useCallback((index: number, field: TField, displayValue: number) => {
    setEditingCell({ index, field, value: displayValue, originalValue: displayValue });
  }, []);

  const updateEditingValue = useCallback((rawString: string, parser: (s: string) => number = (s) => parseInt(s, 10)) => {
    setEditingCell(prev => {
      if (!prev) return prev;
      return { ...prev, value: rawString === '' ? '' : parser(rawString) || 0 };
    });
  }, []);

  /** Try to commit the current numeric edit. Returns true if save was attempted. */
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

  const getDescriptionEditProps = useCallback((index: number, description: string) => ({
    onFocus: (_e: React.FocusEvent<HTMLSpanElement>) => {
      descriptionOriginalRef.current = description;
    },
    onBlur: (e: React.FocusEvent<HTMLSpanElement>) => {
      if (isReadOnly) {
        e.currentTarget.textContent = descriptionOriginalRef.current;
        return;
      }
      const newDescription = (e.currentTarget.textContent || '').trim();
      if (!newDescription) {
        e.currentTarget.textContent = descriptionOriginalRef.current;
      } else if (newDescription !== descriptionOriginalRef.current) {
        onSaveDescription?.(index, newDescription);
      }
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isReadOnly) {
          triggerOverlay();
          e.currentTarget.textContent = descriptionOriginalRef.current;
          (e.target as HTMLElement).blur();
          return;
        }
        const newDescription = (e.currentTarget.textContent || '').trim();
        if (!newDescription) {
          e.currentTarget.textContent = descriptionOriginalRef.current;
        } else if (newDescription !== descriptionOriginalRef.current) {
          onSaveDescription?.(index, newDescription);
        }
        (e.target as HTMLElement).blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.currentTarget.textContent = descriptionOriginalRef.current;
        (e.target as HTMLElement).blur();
      }
    },
  }), [isReadOnly, triggerOverlay, onSaveDescription]);

  return {
    editingCell,
    startEditing,
    updateEditingValue,
    handleNumericKeyDown,
    handleNumericBlur,
    getDescriptionEditProps,
  };
}
