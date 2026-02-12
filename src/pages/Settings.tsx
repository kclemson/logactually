import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Star, ArrowDownUp, Plus, Dumbbell, User, Settings2, Info } from "lucide-react";
import { Link } from "react-router-dom";
import type { WeightUnit } from "@/lib/weight-units";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import { CalorieBurnDialog } from "@/components/CalorieBurnDialog";
import { useQueryClient } from "@tanstack/react-query";
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
import { AppleHealthImport } from "@/components/AppleHealthImport";
export default function Settings() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [mounted, setMounted] = useState(false);
  const { data: isAdmin } = useIsAdmin();
  const showWeightsFeature = FEATURES.WEIGHT_TRACKING || isAdmin;
  const showWeights = showWeightsFeature && settings.showWeights;
  const { isReadOnly } = useReadOnlyContext();
  const isDemoUser = user?.email === DEMO_EMAIL;

  // Password change dialog
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [calorieBurnDialogOpen, setCalorieBurnDialogOpen] = useState(false);

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
  const { isExporting, exportFoodLog, exportWeightLog } = useExportData();

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
      <CollapsibleSection title="Account" icon={User} storageKey="settings-account">
        <div className="space-y-4">
          {/* Email row */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          {/* Security row */}
          {(!isReadOnly || !isDemoUser) && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Security</p>
              <div className="flex gap-2">
                {!isDemoUser && (
                  <button
                    onClick={() => setDeleteAccountOpen(true)}
                    className="rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    Delete Account
                  </button>
                )}
                {!isReadOnly && (
                  <button
                    onClick={() => setChangePasswordOpen(true)}
                    className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  >
                    Change Password
                  </button>
                )}
              </div>
            </div>
          )}
          {/* Session row */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Session</p>
            <button
              onClick={async () => {
                setIsSigningOut(true);
                await signOut({ clearQueryCache: () => queryClient.clear() });
              }}
              disabled={isSigningOut}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {/* Preferences - theme and units */}
      <CollapsibleSection title="Preferences" icon={Settings2} storageKey="settings-preferences">
        <div className="space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Theme</p>
            <div className="flex gap-2">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 transition-colors",
                    mounted && theme === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Daily Calorie Target */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Daily Calorie Target</p>
              <p className="text-[10px] text-muted-foreground/70">Show <span className="text-green-500 dark:text-green-400">●</span> <span className="text-amber-500 dark:text-amber-400">●</span> <span className="text-rose-500 dark:text-rose-400">●</span> color indicators on calendar view</p>
            </div>
            <input
              type="number"
              placeholder="Not set"
              value={settings.dailyCalorieTarget ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                updateSettings({ dailyCalorieTarget: val });
              }}
              className="w-20 h-8 text-center text-sm rounded-md border border-input bg-background px-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              min={0}
              max={99999}
            />
          </div>

          {/* Show Exercise toggle */}
          {showWeightsFeature && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Show Exercise</p>
              <button
                onClick={() => updateSettings({ showWeights: !settings.showWeights })}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative border",
                  settings.showWeights ? "bg-primary border-primary" : "bg-muted border-border"
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-0.5 w-5 h-5 rounded-full shadow transition-transform",
                    settings.showWeights 
                      ? "translate-x-6 bg-primary-foreground" 
                      : "translate-x-0.5 bg-white"
                  )}
                />
              </button>
            </div>
          )}

          {/* Weight Units - shown when weights enabled */}
          {showWeights && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Weight Units</p>
              <div className="flex gap-2">
                {weightUnitOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleWeightUnitChange(value)}
                    className={cn(
                      "flex items-center justify-center rounded-lg border px-3 py-2 transition-colors",
                      settings.weightUnit === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                    )}
                  >
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calorie Burn Estimates - shown when weights enabled */}
          {showWeights && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Show estimated calorie burn</p>
              <button
              onClick={() => setCalorieBurnDialogOpen(true)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                {settings.calorieBurnEnabled ? 'Configure' : 'Set up'}
              </button>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Saved Meals - frequently accessed */}
      <CollapsibleSection title="Saved Meals" icon={Star} storageKey="settings-meals">
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
        {/* Suggest saves toggle */}
        {!isReadOnly && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Suggest saves</p>
            <button
              onClick={() => updateSettings({ suggestMealSaves: !settings.suggestMealSaves })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative border",
                settings.suggestMealSaves ? "bg-primary border-primary" : "bg-muted border-border"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-0.5 w-5 h-5 rounded-full shadow transition-transform",
                  settings.suggestMealSaves 
                    ? "translate-x-6 bg-primary-foreground" 
                    : "translate-x-0.5 bg-white"
                )}
              />
            </button>
          </div>
        )}
      </CollapsibleSection>

      {/* Saved Routines - weight tracking (gated by feature flag or admin) */}
      {showWeights && (
        <CollapsibleSection title="Saved Routines" icon={Dumbbell} storageKey="settings-routines">
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
          {/* Suggest saves toggle */}
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
      )}

      {/* Import and Export */}
      <CollapsibleSection title="Import and Export" icon={ArrowDownUp} storageKey="settings-export">
        <div className="space-y-4">
          {/* Food export row */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Export food logs to CSV</p>
            <button
              onClick={exportFoodLog}
              disabled={isExporting || isReadOnly}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              Daily Food Log
            </button>
          </div>
          {/* Exercise export row */}
          {showWeights && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Export exercise logs to CSV</p>
              <button
                onClick={exportWeightLog}
                disabled={isExporting || isReadOnly}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                Daily Exercise Log
              </button>
            </div>
          )}
          {/* Apple Health import */}
          {showWeights && !isReadOnly && (
            <AppleHealthImport />
          )}
          {isReadOnly && (
            <p className="text-xs text-muted-foreground mt-2">
              Create an account to export your data
            </p>
          )}
        </div>
      </CollapsibleSection>

      {/* About section */}
      <CollapsibleSection title="About" icon={Info} defaultOpen={true} storageKey="settings-about">
        <div className="space-y-2">
          <Link
            to="/privacy"
            className="block text-sm text-foreground hover:underline underline-offset-2 transition-colors"
          >
            Privacy & Security
          </Link>
          <Link
            to="/changelog"
            className="block text-sm text-foreground hover:underline underline-offset-2 transition-colors"
          >
            Changelog (last updated Feb-12)
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

      {/* Calorie Burn Dialog */}
      {calorieBurnDialogOpen && (
        <CalorieBurnDialog
          open={calorieBurnDialogOpen}
          onOpenChange={setCalorieBurnDialogOpen}
          settings={settings}
          updateSettings={updateSettings}
        />
      )}
    </div>
  );
}
