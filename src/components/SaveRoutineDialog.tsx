import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { WeightSet } from '@/types/weight';

interface SaveRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawInput: string | null;
  exerciseSets: WeightSet[];
  onSave: (name: string) => void;
  isSaving: boolean;
  suggestedName: string | null;
  isSuggestingName: boolean;
}

/**
 * Extract a fallback name from the first exercise description.
 */
function getFallbackName(exerciseSets: WeightSet[]): string {
  if (exerciseSets.length === 0) return '';
  return exerciseSets[0].description;
}

export function SaveRoutineDialog({
  open,
  onOpenChange,
  rawInput,
  exerciseSets,
  onSave,
  isSaving,
  suggestedName,
  isSuggestingName,
}: SaveRoutineDialogProps) {
  const [name, setName] = useState('');
  const [userHasTyped, setUserHasTyped] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setUserHasTyped(false);
    }
  }, [open]);

  // Populate with suggested name when it arrives (if user hasn't typed)
  useEffect(() => {
    if (!userHasTyped && suggestedName) {
      setName(suggestedName);
    } else if (!userHasTyped && !isSuggestingName && !suggestedName && exerciseSets.length > 0) {
      // Fallback to first exercise if AI fails and finished loading
      setName(getFallbackName(exerciseSets));
    }
  }, [suggestedName, isSuggestingName, userHasTyped, exerciseSets]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setUserHasTyped(true);
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed) {
      onSave(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      e.preventDefault();
      handleSave();
    }
  };

  const isGenerating = isSuggestingName && !userHasTyped;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Routine</DialogTitle>
          <DialogDescription>
            Give this routine a name to quickly log it again later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="routine-name">Routine name</Label>
            <div className="relative">
              {isGenerating && (
                <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              <Input
                id="routine-name"
                value={name}
                onChange={handleNameChange}
                onKeyDown={handleKeyDown}
                placeholder=""
                disabled={isSaving || isGenerating}
                autoFocus={!isGenerating}
                className={isGenerating ? "pl-10" : ""}
                spellCheck={false}
              />
              {isGenerating && (
                <div className="absolute left-10 top-0 bottom-0 flex items-center pointer-events-none text-muted-foreground italic">
                  <span>Generating suggested name...</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Exercises ({exerciseSets.length}):</p>
            <ul className="list-disc list-inside space-y-0.5">
              {exerciseSets.slice(0, 5).map((set, i) => (
                <li key={i} className="truncate">
                  {set.description} ({set.sets}×{set.reps} @ {set.weight_lbs}lbs)
                </li>
              ))}
              {exerciseSets.length > 5 && (
                <li className="text-muted-foreground/70">+{exerciseSets.length - 5} more...</li>
              )}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving || isGenerating}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Saving...
              </>
            ) : (
              'Save Routine'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
