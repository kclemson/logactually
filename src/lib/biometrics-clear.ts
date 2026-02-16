import type { UserSettings } from '@/hooks/useUserSettings';

const BIOMETRIC_KEYS = ['bodyWeightLbs', 'heightInches', 'age', 'bodyComposition'] as const;

/**
 * Returns the biometric fields to nullify when a feature is being disabled.
 * Only clears shared biometrics if no other consumer still needs them.
 */
export function buildBiometricsClearUpdates(
  settings: UserSettings,
  disabling: 'burn' | 'target',
): Partial<UserSettings> {
  const otherNeedsBiometrics =
    disabling === 'burn'
      ? settings.calorieTargetEnabled && settings.calorieTargetMode === 'body_stats'
      : settings.calorieBurnEnabled;

  if (otherNeedsBiometrics) return {};

  return Object.fromEntries(
    BIOMETRIC_KEYS.map(k => [k, null])
  ) as Partial<UserSettings>;
}
