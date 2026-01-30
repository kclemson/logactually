import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Star, Download, Plus, Dumbbell, User, Settings2, Info } from "lucide-react";
import { Link } from "react-router-dom";
import type { WeightUnit } from "@/lib/weight-units";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useSavedMeals, useUpdateSavedMeal, useDeleteSavedMeal } from "@/hooks/useSavedMeals";
import { useSavedRoutines, useUpdateSavedRoutine, useDeleteSavedRoutine } from "@/hooks/useSavedRoutines";
import { Button } from "@/components/ui/button";
import { useExportData } from "@/hooks/useExportData";
import { CreateMealDialog } from "@/components/CreateMealDialog";
import { CreateRoutineDialog } from "@/components/CreateRoutineDialog";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { SavedMealRow } from "@/components/SavedMealRow";
import { SavedRoutineRow } from "@/components/SavedRoutineRow";
import { FEATURES } from "@/lib/feature-flags";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/hooks/useAuth";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { useReadOnlyContext } from "@/contexts/ReadOnlyContext";
import { DEMO_EMAIL } from "@/lib/demo-mode";

export default function Settings() {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [mounted, setMounted] = useState(false);
  const { data: isAdmin } = useIsAdmin();
  const showWeights = FEATURES.WEIGHT_TRACKING || isAdmin;
  const { isReadOnly } = useReadOnlyContext();
  const isDemoUser = user?.email === DEMO_EMAIL;

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

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    setTheme(value);
    updateSettings({ theme: value });
  };

  const toggleMealExpand = (id: string) => {
    setExpandedMealIds((prev) => {
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
    setExpandedRoutineIds((prev) => {
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
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  const weightUnitOptions: { value: WeightUnit; label: string }[] = [
    { value: "lbs", label: "Lbs" },
    { value: "kg", label: "Kg" },
  ];

  const handleWeightUnitChange = (value: WeightUnit) => {
    updateSettings({ weightUnit: value });
  };

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
            {!isDemoUser && (
              <button
                onClick={() => setDeleteAccountOpen(true)}
                className="text-sm text-muted-foreground hover:text-destructive hover:underline"
              >
                Delete account
              </button>
            )}
          </div>
          <div className="space-y-1">
            {!isReadOnly && (
              <button
                onClick={() => setChangePasswordOpen(true)}
                className="w-full text-left py-2 hover:bg-accent/50 transition-colors text-sm text-foreground"
              >
                Change Password
              </button>
            )}
            <button
              onClick={async () => {
                setIsSigningOut(true);
                await signOut();
              }}
              disabled={isSigningOut}
              className="w-full text-left py-2 hover:bg-accent/50 transition-colors text-sm text-foreground disabled:opacity-50"
            >
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {/* Saved Meals - frequently accessed */}
      <CollapsibleSection title="Saved Meals" icon={Star}>
        {/* Add button as first row */}
        {!isReadOnly && (
          <button
            onClick={() => setCreateMealDialogOpen(true)}
            className="w-full text-left py-2 hover:bg-accent/50 transition-colors flex items-center gap-2 text-sm text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span>Add Saved Meal</span>
          </button>
        )}
        {mealsLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !savedMeals?.length ? (
          !isReadOnly ? null : <p className="text-sm text-muted-foreground">No saved meals yet</p>
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
        <CollapsibleSection title="Saved Routines" icon={Dumbbell}>
          {/* Add button as first row */}
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
        </CollapsibleSection>
      )}

      {/* Preferences - theme and units */}
      <CollapsibleSection title="Preferences" icon={Settings2}>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Theme</p>
            <div className="flex gap-2 max-w-xs">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 transition-colors",
                    mounted && theme === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
          {showWeights && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Weight Units</p>
              <div className="flex gap-2 max-w-[160px]">
                {weightUnitOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleWeightUnitChange(value)}
                    className={cn(
                      "flex flex-1 items-center justify-center rounded-lg border px-3 py-2 transition-colors",
                      settings.weightUnit === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                    )}
                  >
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Export as CSV */}
      <CollapsibleSection title="Export to CSV" icon={Download}>
        <div className="space-y-1">
          <button 
            onClick={exportDailyTotals} 
            disabled={isExporting || isReadOnly}
            className="w-full text-left py-2 hover:bg-accent/50 transition-colors text-sm text-foreground disabled:opacity-50"
          >
            Food Daily Totals
          </button>
          <button 
            onClick={exportFoodLog} 
            disabled={isExporting || isReadOnly}
            className="w-full text-left py-2 hover:bg-accent/50 transition-colors text-sm text-foreground disabled:opacity-50"
          >
            Food Log
          </button>
          {showWeights && (
            <button 
              onClick={exportWeightLog} 
              disabled={isExporting || isReadOnly}
              className="w-full text-left py-2 hover:bg-accent/50 transition-colors text-sm text-foreground disabled:opacity-50"
            >
              Weights Log
            </button>
          )}
          {isReadOnly && (
            <p className="text-xs text-muted-foreground mt-2">
              Create an account to export your data
            </p>
          )}
        </div>
      </CollapsibleSection>

      {/* About section */}
      <CollapsibleSection title="About" icon={Info} defaultOpen={true}>
        <div className="space-y-2">
          <Link
            to="/privacy"
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Privacy & Security
          </Link>
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
          userEmail={user?.email || ""}
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
      {deleteAccountOpen && <DeleteAccountDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen} />}
    </div>
  );
}
