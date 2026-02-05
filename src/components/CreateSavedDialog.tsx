import { useState, useRef, useCallback, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogInput, LogInputRef } from '@/components/LogInput';

type DialogState = 'input' | 'analyzing' | 'editing' | 'saving' | 'prompting';

/**
 * Configuration for mode-specific behavior of the CreateSavedDialog.
 */
export interface CreateSavedDialogConfig<TItem, TSaved> {
  // UI Strings
  title: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  namePlaceholder: string;
  saveButton: string;
  savedTitle: string;
  logPromptMessage: (name: string) => string;
  
  // Data transformation
  getFallbackName: (items: TItem[]) => string;
  getDescriptions: (items: TItem[]) => string[];
}

export interface CreateSavedDialogProps<TItem, TSaved> {
  mode: 'food' | 'weights';
  config: CreateSavedDialogConfig<TItem, TSaved>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (saved: TSaved, items: TItem[]) => void;
  showLogPrompt?: boolean;
  
  // Hook results passed as props (to respect rules of hooks)
  analyzeResult: {
    analyze: (text: string) => Promise<TItem[] | null>;
    isAnalyzing: boolean;
    error: string | null;
  };
  saveResult: {
    mutate: (params: { name: string; originalInput: string | null; items: TItem[]; isAutoNamed: boolean }, options: { onSuccess: (data: TSaved) => void; onError: () => void }) => void;
  };
  
  // Editable items hook result
  editableItemsResult: {
    displayItems: TItem[];
    updateItem: (index: number, field: keyof TItem, value: string | number) => void;
    updateItemBatch: (index: number, updates: Partial<TItem>) => void;
    removeItem: (index: number) => void;
    setItems: (items: TItem[]) => void;
  };
  
  // Table renderer
  renderItemsTable: (props: {
    items: TItem[];
    editable: boolean;
    onUpdateItem: (index: number, field: keyof TItem, value: string | number) => void;
    onUpdateItemBatch: (index: number, updates: Partial<TItem>) => void;
    onRemoveItem: (index: number) => void;
  }) => ReactNode;
}

export function CreateSavedDialog<TItem, TSaved>({
  mode,
  config,
  open,
  onOpenChange,
  onCreated,
  showLogPrompt = true,
  analyzeResult,
  saveResult,
  editableItemsResult,
  renderItemsTable,
}: CreateSavedDialogProps<TItem, TSaved>) {
  const [state, setState] = useState<DialogState>('input');
  const [name, setName] = useState('');
  const [userHasTyped, setUserHasTyped] = useState(false);
  const [rawInput, setRawInput] = useState<string | null>(null);
  const [createdItem, setCreatedItem] = useState<TSaved | null>(null);
  
  const inputRef = useRef<LogInputRef>(null);
  
  const { analyze, isAnalyzing, error: analyzeError } = analyzeResult;
  const { displayItems, updateItem, updateItemBatch, removeItem, setItems } = editableItemsResult;

  // Helper to close everything and reset state
  const closeAll = useCallback(() => {
    setState('input');
    setName('');
    setUserHasTyped(false);
    setRawInput(null);
    setCreatedItem(null);
    setItems([]);
    onOpenChange(false);
  }, [onOpenChange, setItems]);

  // Handle analysis submission
  const handleSubmit = async (text: string) => {
    setState('analyzing');
    setRawInput(text);
    
    const result = await analyze(text);
    
    if (result) {
      setItems(result);
      setState('editing');
      
      // Set name immediately using fallback
      setName(prevName => prevName.trim() ? prevName : config.getFallbackName(result));
    } else {
      setState('input');
    }
  };

  // Handle name input changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setUserHasTyped(true);
  };

  // Handle saving
  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || displayItems.length === 0) return;
    
    setState('saving');
    
    saveResult.mutate(
      {
        name: trimmedName,
        originalInput: rawInput,
        items: displayItems,
        isAutoNamed: !userHasTyped,
      },
      {
        onSuccess: (savedData) => {
          setCreatedItem(savedData);
          if (showLogPrompt) {
            setState('prompting');
          } else {
            onCreated(savedData, displayItems);
            onOpenChange(false);
          }
        },
        onError: () => {
          setState('editing');
        },
      }
    );
  };

  // Handle "Also add to today's log?" prompt responses
  const handleLogYes = () => {
    if (createdItem) {
      onCreated(createdItem, displayItems);
    }
    closeAll();
  };

  const handleLogNo = () => {
    closeAll();
  };

  // Handle item updates
  const handleItemUpdate = useCallback((index: number, field: keyof TItem, value: string | number) => {
    updateItem(index, field, value);
  }, [updateItem]);

  const handleItemUpdateBatch = useCallback((index: number, updates: Partial<TItem>) => {
    updateItemBatch(index, updates);
  }, [updateItemBatch]);

  const handleItemRemove = useCallback((index: number) => {
    removeItem(index);
  }, [removeItem]);

  const isEditing = state === 'editing' || state === 'saving';
  const canSave = name.trim() && displayItems.length > 0 && state === 'editing';

  return (
    <>
      <Dialog open={open && state !== 'prompting'} onOpenChange={onOpenChange}>
        <DialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{config.title}</DialogTitle>
            <DialogDescription>{config.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name input */}
            <div className="space-y-2">
              <Label htmlFor="saved-name">Name</Label>
              <Input
                id="saved-name"
                value={name}
                onChange={handleNameChange}
                placeholder={config.namePlaceholder}
                disabled={state === 'saving'}
                spellCheck={false}
              />
            </div>

            {/* Input - only show when in input or analyzing state */}
            {(state === 'input' || state === 'analyzing') && (
              <div className="space-y-2">
                <Label>{config.inputLabel}</Label>
                <LogInput
                  mode={mode}
                  ref={inputRef}
                  onSubmit={handleSubmit}
                  isLoading={isAnalyzing}
                  placeholder={config.inputPlaceholder}
                />
                {analyzeError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    Analysis failed: {analyzeError}
                  </div>
                )}
              </div>
            )}

            {/* Items table - show after analysis */}
            {(state === 'editing' || state === 'saving') && displayItems.length > 0 && (
              <div className="space-y-2">
                <Label>Items</Label>
                {renderItemsTable({
                  items: displayItems,
                  editable: state !== 'saving',
                  onUpdateItem: handleItemUpdate,
                  onUpdateItemBatch: handleItemUpdateBatch,
                  onRemoveItem: handleItemRemove,
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={state === 'saving'}>
              Cancel
            </Button>
            {isEditing && (
              <Button onClick={handleSave} disabled={!canSave}>
                {state === 'saving' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  config.saveButton
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* "Also add to today's log?" prompt */}
      <AlertDialog 
        open={open && state === 'prompting'} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeAll();
          }
        }}
      >
        <AlertDialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{config.savedTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {config.logPromptMessage(name)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleLogNo}>No, just save</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogYes}>Yes, log it too</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
