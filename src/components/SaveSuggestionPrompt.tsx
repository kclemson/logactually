import { ReactNode, useMemo, useState, useCallback } from 'react';
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
  }) => ReactNode;
  isLoading?: boolean;
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
}: SaveSuggestionPromptProps<T>) {
  const itemLabel = mode === 'food' ? 'items' : 'exercises';
  const saveLabel = mode === 'food' ? 'Save as Meal' : 'Save as Routine';
  
  // Handle item updates
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
          You've logged similar {itemLabel} <span className="font-medium">{matchCount} times</span>. 
          Save for quick access?
        </p>
      </div>
      
      {/* Editable items preview */}
      {renderItemsTable({
        items,
        editable: true,
        onUpdateItem: handleUpdateItem,
        onUpdateItemBatch: handleUpdateItemBatch,
        onRemoveItem: handleRemoveItem,
      })}
      
      <div className="flex flex-wrap items-center gap-2">
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
        
        {/* Progressive opt-out link - only shows after 3+ dismissals */}
        {showOptOutLink && (
          <button
            onClick={onOptOut}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline ml-auto"
          >
            Don't suggest saves
          </button>
        )}
      </div>
    </div>
  );
}
