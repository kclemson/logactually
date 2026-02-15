import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Settings from './Settings';

// ── Mocks ──────────────────────────────────────────────────

let mockSettings = {
  theme: 'system' as const,
  weightUnit: 'lbs' as const,
  showWeights: true,
  showCustomLogs: true,
  suggestMealSaves: true,
  suggestRoutineSaves: true,
  dailyCalorieTarget: null,
  calorieTargetEnabled: false,
  calorieTargetMode: 'static' as const,
  activityLevel: null,
  dailyDeficit: null,
  calorieBurnEnabled: false,
  bodyWeightLbs: null,
  heightInches: null,
  heightUnit: 'ft' as const,
  age: null,
  bodyComposition: null,
  defaultIntensity: null,
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock('@/hooks/useUserSettings', () => ({
  useUserSettings: () => ({
    settings: mockSettings,
    updateSettings: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('@/contexts/ReadOnlyContext', () => ({
  useReadOnlyContext: () => ({
    isReadOnly: false,
    isLoading: false,
    showOverlay: false,
    overlayMode: 'welcome' as const,
    triggerOverlay: vi.fn(),
    dismissOverlay: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSavedMeals', () => ({
  useSavedMeals: () => ({ data: [], isLoading: false }),
  useUpdateSavedMeal: () => ({ mutate: vi.fn() }),
  useDeleteSavedMeal: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/hooks/useSavedRoutines', () => ({
  useSavedRoutines: () => ({ data: [], isLoading: false }),
  useUpdateSavedRoutine: () => ({ mutate: vi.fn() }),
  useDeleteSavedRoutine: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/hooks/useCustomLogTypes', () => ({
  useCustomLogTypes: () => ({
    logTypes: [],
    isLoading: false,
    createType: { mutate: vi.fn(), isPending: false },
    updateType: { mutate: vi.fn() },
    deleteType: { mutate: vi.fn() },
    recentUsage: {},
  }),
}));

vi.mock('@/hooks/useExportData', () => ({
  useExportData: () => ({
    isExporting: false,
    exportFoodLog: vi.fn(),
    exportWeightLog: vi.fn(),
  }),
}));

vi.mock('@/hooks/useIsAdmin', () => ({
  useIsAdmin: () => ({ data: false }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: vi.fn() }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return { ...actual, useQueryClient: () => ({ clear: vi.fn() }) };
});

vi.mock('@/hooks/useDailyCalorieBurn', () => ({
  useDailyCalorieBurn: () => ({ data: [], isLoading: false }),
}));

// ── Tests ──────────────────────────────────────────────────

function renderSettings() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Settings smoke test', () => {
  beforeEach(() => {
    // Reset to all-features-on defaults
    mockSettings = {
      theme: 'system',
      weightUnit: 'lbs',
      showWeights: true,
      showCustomLogs: true,
      suggestMealSaves: true,
      suggestRoutineSaves: true,
  dailyCalorieTarget: null,
      calorieTargetEnabled: false,
      calorieTargetMode: 'static',
      activityLevel: null,
      dailyDeficit: null,
      calorieBurnEnabled: false,
      bodyWeightLbs: null,
      heightInches: null,
      heightUnit: 'ft',
      age: null,
      bodyComposition: null,
      defaultIntensity: null,
    };
  });

  it('renders all section headers when all features enabled', () => {
    renderSettings();

    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Custom Log Types')).toBeInTheDocument();
    expect(screen.getByText('Saved Meals')).toBeInTheDocument();
    expect(screen.getByText('Saved Routines')).toBeInTheDocument();
    expect(screen.getByText('Import and Export')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('hides Saved Routines and Custom Log Types when feature flags are off', () => {
    mockSettings = { ...mockSettings, showWeights: false, showCustomLogs: false };
    renderSettings();

    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Saved Meals')).toBeInTheDocument();
    expect(screen.getByText('Import and Export')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();

    expect(screen.queryByText('Saved Routines')).not.toBeInTheDocument();
    expect(screen.queryByText('Custom Log Types')).not.toBeInTheDocument();
  });
});
