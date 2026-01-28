import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Star, SunMoon, Download, Plus, Dumbbell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useSavedMeals, useUpdateSavedMeal, useDeleteSavedMeal } from '@/hooks/useSavedMeals';
import { useSavedRoutines, useUpdateSavedRoutine, useDeleteSavedRoutine } from '@/hooks/useSavedRoutines';
import { Button } from '@/components/ui/button';
import { useExportData } from '@/hooks/useExportData';
import { CreateMealDialog } from '@/components/CreateMealDialog';
import { CreateRoutineDialog } from '@/components/CreateRoutineDialog';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { SavedMealRow } from '@/components/SavedMealRow';
import { SavedRoutineRow } from '@/components/SavedRoutineRow';
import { FEATURES } from '@/lib/feature-flags';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/hooks/useAuth';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [mounted, setMounted] = useState(false);
  const { data: isAdmin } = useIsAdmin();
  const showWeights = FEATURES.WEIGHT_TRACKING || isAdmin;
  const { user } = useAuth();
  
  // Password change dialog
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  
  // Saved meals
  const { data: savedMeals, isLoading: mealsLoading } = useSavedMeals();
  const updateMeal = useUpdateSavedMeal();
  const deleteMeal = useDeleteSavedMeal();
  const [openMealPopoverId, setOpenMealPopoverId] = useState<string | null>(null);
  const [createMealDialogOpen, setCreateMealDialogOpen] = useState(false);
  const [expandedMealIds, setExpandedMealIds] = useState<Set<string>>(new Set());
  
  // Saved routines (weight tracking)
  const { data: savedRoutines, isLoading: routinesLoading } = useSavedRoutines();
  const updateRoutine = useUpdateSavedRoutine();
  const deleteRoutine = useDeleteSavedRoutine();
  const [openRoutinePopoverId, setOpenRoutinePopoverId] = useState<string | null>(null);
  const [createRoutineDialogOpen, setCreateRoutineDialogOpen] = useState(false);
  const [expandedRoutineIds, setExpandedRoutineIds] = useState<Set<string>>(new Set());
  
  // Export data
  const { isExporting, exportDailyTotals, exportFoodLog, exportWeightLog } = useExportData();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);


  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    updateSettings({ theme: value });
  };

  const toggleMealExpand = (id: string) => {
    setExpandedMealIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleRoutineExpand = (id: string) => {
    setExpandedRoutineIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Account section */}
      <CollapsibleSection title="Account" icon={User}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm">{user?.email}</p>
            </div>
            <button
              onClick={() => setDeleteAccountOpen(true)}
              className="text-sm text-muted-foreground hover:text-destructive hover:underline"
            >
              Delete account
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChangePasswordOpen(true)}
          >
            Change Password
          </Button>
        </div>
      </CollapsibleSection>

      {/* Saved Meals - frequently accessed */}
      <CollapsibleSection
        title="Saved Meals"
        icon={Star}
        headerAction={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCreateMealDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        }
      >
        {mealsLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !savedMeals?.length ? (
          <p className="text-sm text-muted-foreground">No saved meals yet</p>
        ) : (
          <ul className="space-y-0">
            {savedMeals.map((meal) => (
              <SavedMealRow
                key={meal.id}
                meal={meal}
                isExpanded={expandedMealIds.has(meal.id)}
                onToggleExpand={() => toggleMealExpand(meal.id)}
                onUpdateMeal={(params) => updateMeal.mutate(params)}
                onDeleteMeal={(id) => deleteMeal.mutate(id)}
                openDeletePopoverId={openMealPopoverId}
                setOpenDeletePopoverId={setOpenMealPopoverId}
              />
            ))}
          </ul>
        )}
      </CollapsibleSection>

      {/* Saved Routines - weight tracking (gated by feature flag or admin) */}
      {showWeights && (
        <CollapsibleSection
          title="Saved Routines"
          icon={Dumbbell}
          headerAction={
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCreateRoutineDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          }
        >
          {routinesLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !savedRoutines?.length ? (
            <p className="text-sm text-muted-foreground">No saved routines yet</p>
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
        </CollapsibleSection>
      )}

      {/* Appearance - set once */}
      <CollapsibleSection title="Appearance" icon={SunMoon}>
        <div className="flex gap-2 max-w-xs">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 transition-colors",
                mounted && theme === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Export as CSV */}
      <CollapsibleSection title="Export to CSV" icon={Download}>
        <div className="flex flex-wrap gap-2 max-w-md">
          <Button
            variant="outline"
            size="sm"
            onClick={exportDailyTotals}
            disabled={isExporting}
          >
            Food Daily Totals
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportFoodLog}
            disabled={isExporting}
          >
            Food Log
          </Button>
          {showWeights && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportWeightLog}
              disabled={isExporting}
            >
              Weight Log
            </Button>
          )}
        </div>
      </CollapsibleSection>

      {/* Create New Meal Dialog */}
      {createMealDialogOpen && (
        <CreateMealDialog
          open={createMealDialogOpen}
          onOpenChange={setCreateMealDialogOpen}
          onMealCreated={() => {}}
          showLogPrompt={false}
        />
      )}

      {/* Change Password Dialog */}
      {changePasswordOpen && (
        <ChangePasswordDialog
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
          userEmail={user?.email || ''}
        />
      )}

      {/* Create New Routine Dialog */}
      {createRoutineDialogOpen && (
        <CreateRoutineDialog
          open={createRoutineDialogOpen}
          onOpenChange={setCreateRoutineDialogOpen}
          onRoutineCreated={() => {}}
          showLogPrompt={false}
        />
      )}

      {/* Delete Account Dialog */}
      {deleteAccountOpen && (
        <DeleteAccountDialog
          open={deleteAccountOpen}
          onOpenChange={setDeleteAccountOpen}
        />
      )}

    </div>
  );
}
