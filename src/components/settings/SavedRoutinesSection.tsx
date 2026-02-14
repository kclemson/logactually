import { useState } from 'react';
import { Dumbbell, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { SavedRoutineRow } from '@/components/SavedRoutineRow';
import { CreateRoutineDialog } from '@/components/CreateRoutineDialog';
import { useSavedRoutines, useUpdateSavedRoutine, useDeleteSavedRoutine } from '@/hooks/useSavedRoutines';
import type { UserSettings } from '@/hooks/useUserSettings';

interface SavedRoutinesSectionProps {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  isReadOnly: boolean;
}

export function SavedRoutinesSection({ settings, updateSettings, isReadOnly }: SavedRoutinesSectionProps) {
  const { data: savedRoutines, isLoading: routinesLoading } = useSavedRoutines();
  const updateRoutine = useUpdateSavedRoutine();
  const deleteRoutine = useDeleteSavedRoutine();
  const [openRoutinePopoverId, setOpenRoutinePopoverId] = useState<string | null>(null);
  const [createRoutineDialogOpen, setCreateRoutineDialogOpen] = useState(false);
  const [expandedRoutineIds, setExpandedRoutineIds] = useState<Set<string>>(new Set());

  const toggleRoutineExpand = (id: string) => {
    setExpandedRoutineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <CollapsibleSection title="Saved Routines" icon={Dumbbell} storageKey="settings-routines" iconClassName="text-purple-500 dark:text-purple-400">
        {!isReadOnly && (
          <button
            onClick={() => setCreateRoutineDialogOpen(true)}
            className="w-full text-left py-2 hover:bg-accent/50 transition-colors flex items-center gap-2 text-sm text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span>Add Saved Routine</span>
          </button>
        )}
        {routinesLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !savedRoutines?.length ? (
          !isReadOnly ? null : <p className="text-sm text-muted-foreground">No saved routines yet</p>
        ) : (
          <ul className="space-y-0">
            {savedRoutines.map((routine) => (
              <SavedRoutineRow
                key={routine.id}
                routine={routine}
                isExpanded={expandedRoutineIds.has(routine.id)}
                onToggleExpand={() => toggleRoutineExpand(routine.id)}
                onUpdateRoutine={(params) => updateRoutine.mutate(params)}
                onDeleteRoutine={(id) => deleteRoutine.mutate(id)}
                openDeletePopoverId={openRoutinePopoverId}
                setOpenDeletePopoverId={setOpenRoutinePopoverId}
              />
            ))}
          </ul>
        )}
        {!isReadOnly && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Suggest saves</p>
            <button
              onClick={() => updateSettings({ suggestRoutineSaves: !settings.suggestRoutineSaves })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative border",
                settings.suggestRoutineSaves ? "bg-primary border-primary" : "bg-muted border-border"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-0.5 w-5 h-5 rounded-full shadow transition-transform",
                  settings.suggestRoutineSaves
                    ? "translate-x-6 bg-primary-foreground"
                    : "translate-x-0.5 bg-white"
                )}
              />
            </button>
          </div>
        )}
      </CollapsibleSection>

      {createRoutineDialogOpen && (
        <CreateRoutineDialog
          open={createRoutineDialogOpen}
          onOpenChange={setCreateRoutineDialogOpen}
          onRoutineCreated={() => {}}
          showLogPrompt={false}
        />
      )}
    </>
  );
}
