import { useQueryClient } from "@tanstack/react-query";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";
import { useReadOnlyContext } from "@/contexts/ReadOnlyContext";
import { AccountSection } from "@/components/settings/AccountSection";
import { PreferencesSection } from "@/components/settings/PreferencesSection";
import { CustomLogTypesSection } from "@/components/settings/CustomLogTypesSection";
import { SavedMealsSection } from "@/components/settings/SavedMealsSection";
import { SavedRoutinesSection } from "@/components/settings/SavedRoutinesSection";
import { ImportExportSection } from "@/components/settings/ImportExportSection";
import { AboutSection } from "@/components/settings/AboutSection";
import { useCustomLogTypes } from "@/hooks/useCustomLogTypes";

export default function Settings() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { settings, updateSettings, isLoading } = useUserSettings();
  const { isReadOnly } = useReadOnlyContext();
  const { logTypes } = useCustomLogTypes();

  return (
    <div className="space-y-4">
      <PreferencesSection settings={settings} updateSettings={updateSettings} isLoading={isLoading} />
      <SavedMealsSection settings={settings} updateSettings={updateSettings} isReadOnly={isReadOnly} />
      {settings.showWeights && (
        <SavedRoutinesSection settings={settings} updateSettings={updateSettings} isReadOnly={isReadOnly} />
      )}
      {settings.showCustomLogs && <CustomLogTypesSection isReadOnly={isReadOnly} />}
      <ImportExportSection
        showWeights={settings.showWeights}
        showCustomLogs={settings.showCustomLogs ?? false}
        hasCustomLogTypes={logTypes.length > 0}
        isReadOnly={isReadOnly}
      />
      <AccountSection user={user} signOut={signOut} isReadOnly={isReadOnly} queryClient={queryClient} />
      <AboutSection />
    </div>
  );
}
