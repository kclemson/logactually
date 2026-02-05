import { ReactNode, useCallback } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodItem } from '@/types/food';
import { AnalyzedExercise } from '@/types/weight';

interface SaveSuggestionPromptProps<T> {
  mode: 'food' | 'weights';
  matchCount: number;
  items: T[];
  onItemsChange: (items: T[]) => void;
  onSave: () => void;
  onDismiss: () => void;
  onOptOut: () => void;
  showOptOutLink: boolean;
  renderItemsTable: (props: {
    items: T[];
    editable: boolean;
    onUpdateItem: (index: number, field: keyof T, value: string | number) => void;
    onUpdateItemBatch: (index: number, updates: Partial<T>) => void;
    onRemoveItem: (index: number) => void;
    diffs?: Map<number, { sets?: number; reps?: number; weight_lbs?: number }>;
  }) => ReactNode;
  isLoading?: boolean;
  // New: matching routine info for update flow
  matchingRoutine?: {
    id: string;
    name: string;
    diffs?: Map<number, { sets?: number; reps?: number; weight_lbs?: number }>;
  };
  onUpdate?: () => void;  // Called when user clicks "Update Routine"
}

export function SaveSuggestionPrompt<T extends FoodItem | AnalyzedExercise>({
  mode,
  matchCount,
  items,
  onItemsChange,
  onSave,
  onDismiss,
  onOptOut,
  showOptOutLink,
  renderItemsTable,
  isLoading,
  matchingRoutine,
  onUpdate,
}: SaveSuggestionPromptProps<T>) {
  const itemLabel = mode === 'food' ? 'items' : 'exercises';
  const saveLabel = mode === 'food' ? 'Save as Meal' : 'Save as Routine';
  const hasMatchingRoutine = !!matchingRoutine;
  
  const handleUpdateItem = useCallback((index: number, field: keyof T, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onItemsChange(newItems);
  }, [items, onItemsChange]);
  
  const handleUpdateItemBatch = useCallback((index: number, updates: Partial<T>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    onItemsChange(newItems);
  }, [items, onItemsChange]);
  
  const handleRemoveItem = useCallback((index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
  }, [items, onItemsChange]);
  
  return (
    <div className="relative rounded-md border bg-muted/50 p-3 space-y-3">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start gap-2 pr-6">
        <Lightbulb className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
        <p className="text-sm">
          {hasMatchingRoutine ? (
            <>
              You've logged this <span className="font-medium">{matchCount} times</span> and it matches your saved {mode === 'food' ? 'meal' : 'routine'} <span className="font-medium">"{matchingRoutine.name}"</span>. Update it?
            </>
          ) : (
            <>
              You've logged similar {itemLabel} <span className="font-medium">{matchCount} times</span>. Save for quick access?
            </>
          )}
        </p>
      </div>
      
      {/* Editable items preview */}
      {renderItemsTable({
        items,
        editable: true,
        onUpdateItem: handleUpdateItem,
        onUpdateItemBatch: handleUpdateItemBatch,
        onRemoveItem: handleRemoveItem,
        diffs: matchingRoutine?.diffs,
      })}
      
      <div className="flex flex-wrap items-center gap-2">
        {hasMatchingRoutine ? (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={onUpdate}
              disabled={isLoading || items.length === 0}
            >
              Update Routine
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onSave}
              disabled={isLoading || items.length === 0}
            >
              Save as New
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={onSave}
              disabled={isLoading || items.length === 0}
            >
              {saveLabel}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              disabled={isLoading}
            >
              Not Now
            </Button>
          </>
        )}
        
        {/* Progressive opt-out link - only shows after 3+ dismissals */}
        {showOptOutLink && !hasMatchingRoutine && (
          <button
            onClick={onOptOut}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline ml-auto"
          >
            Don't suggest saves
          </button>
        )}
        
        {/* Show dismiss option for update flow */}
        {hasMatchingRoutine && (
          <button
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline ml-auto"
          >
            Not now
          </button>
        )}
      </div>
    </div>
  );
}
