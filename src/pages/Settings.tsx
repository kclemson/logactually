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
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [mounted, setMounted] = useState(false);
  const { data: isAdmin } = useIsAdmin();
  const showWeights = FEATURES.WEIGHT_TRACKING || isAdmin;
  const { user } = useAuth();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
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
  const { isExporting, exportDailyTotals, exportFoodLog } = useExportData();
  
  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    
    setIsChangingPassword(true);
    
    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    });
    
    if (signInError) {
      setPasswordError('Current password is incorrect');
      setIsChangingPassword(false);
      return;
    }
    
    // Update to new password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    
    setIsChangingPassword(false);
  };

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync theme from database on load
  useEffect(() => {
    if (!isLoading && settings.theme && mounted) {
      setTheme(settings.theme);
    }
  }, [isLoading, settings.theme, setTheme, mounted]);

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
    <div className="space-y-6">
      {/* Account section */}
      <CollapsibleSection title="Account" icon={User}>
        <div className="space-y-4">
          {/* Display email */}
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Email</Label>
            <p className="text-sm">{user?.email}</p>
          </div>
          
          {/* Password change form */}
          <form onSubmit={handlePasswordChange} className="space-y-3 max-w-xs">
            <div className="space-y-1">
              <Label htmlFor="currentPassword" className="text-xs">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPassword" className="text-xs">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-xs">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-primary">{passwordSuccess}</p>
            )}
            
            <Button 
              type="submit" 
              variant="outline" 
              size="sm"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? 'Updating...' : 'Change Password'}
            </Button>
          </form>
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
      <CollapsibleSection title="Export Food Data" icon={Download}>
        <div className="flex gap-2 max-w-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={exportDailyTotals}
            disabled={isExporting}
          >
            Daily Totals
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportFoodLog}
            disabled={isExporting}
          >
            Food Log
          </Button>
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

      {/* Create New Routine Dialog */}
      {createRoutineDialogOpen && (
        <CreateRoutineDialog
          open={createRoutineDialogOpen}
          onOpenChange={setCreateRoutineDialogOpen}
          onRoutineCreated={() => {}}
          showLogPrompt={false}
        />
      )}

    </div>
  );
}
