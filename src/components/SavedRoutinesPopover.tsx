import { useState, useMemo } from 'react';
import { Search, Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSavedRoutines, useLogSavedRoutine } from '@/hooks/useSavedRoutines';
import { SavedRoutine, SavedExerciseSet } from '@/types/weight';

interface SavedRoutinesPopoverProps {
  onSelectRoutine: (exerciseSets: SavedExerciseSet[], routineId: string) => void;
  onClose?: () => void;
  onCreateNew?: () => void;
}

export function SavedRoutinesPopover({ onSelectRoutine, onClose, onCreateNew }: SavedRoutinesPopoverProps) {
  const [search, setSearch] = useState('');
  const { data: savedRoutines, isLoading } = useSavedRoutines();
  const logRoutine = useLogSavedRoutine();

  const filteredRoutines = useMemo(() => {
    if (!savedRoutines) return [];
    if (!search.trim()) return savedRoutines;
    
    const query = search.toLowerCase();
    return savedRoutines.filter(routine => 
      routine.name.toLowerCase().includes(query) ||
      routine.exercise_sets.some(set => set.description.toLowerCase().includes(query))
    );
  }, [savedRoutines, search]);

  const handleSelectRoutine = async (routine: SavedRoutine) => {
    const exerciseSets = await logRoutine.mutateAsync(routine.id);
    onSelectRoutine(exerciseSets, routine.id);
    onClose?.();
  };

  const handleCreateNew = () => {
    onClose?.();
    onCreateNew?.();
  };

  // Show search when 10+ routines
  const showSearch = (savedRoutines?.length ?? 0) >= 10;

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  // Empty state with create button
  if (!savedRoutines || savedRoutines.length === 0) {
    return (
      <div className="w-72 p-4 space-y-3">
        {onCreateNew && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleCreateNew}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Routine
          </Button>
        )}
        <p className="text-sm text-muted-foreground text-center">
          No saved routines yet. Create one to quickly log it later.
        </p>
      </div>
    );
  }

  return (
    <div className="w-72">
      {/* Add New Routine button - always visible */}
      {onCreateNew && (
        <button
          onClick={handleCreateNew}
          className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b flex items-center gap-2"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Add New Routine</span>
        </button>
      )}
      
      {showSearch && (
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search routines..."
              className="pl-8 h-8"
            />
          </div>
        </div>
      )}
      
      <div className="max-h-64 overflow-y-auto">
        {filteredRoutines.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No routines match "{search}"
          </div>
        ) : (
          filteredRoutines.map((routine) => {
            const exerciseCount = routine.exercise_sets.length;
            const isLogging = logRoutine.isPending && logRoutine.variables === routine.id;
            
            return (
              <button
                key={routine.id}
                onClick={() => handleSelectRoutine(routine)}
                disabled={logRoutine.isPending}
                className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b last:border-b-0 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{routine.name}</span>
                  {isLogging && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
