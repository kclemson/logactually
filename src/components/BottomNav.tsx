import { NavLink, useSearchParams } from 'react-router-dom';
import { Utensils, CalendarDays, TrendingUp, Settings, Shield, Dumbbell, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { FEATURES } from '@/lib/feature-flags';
import { useUserSettings } from '@/hooks/useUserSettings';

export function BottomNav() {
  const { data: isAdmin } = useIsAdmin();
  const [searchParams] = useSearchParams();
  const { settings } = useUserSettings();
  
  const hideAdmin = searchParams.get('hideAdmin') === 'true';
  const showAdmin = isAdmin && !hideAdmin;
  const showWeights = (FEATURES.WEIGHT_TRACKING || isAdmin) && settings.showWeights;
  const showCustomLogs = settings.showCustomLogs;

  const navItems = [
    { to: '/', icon: Utensils, label: 'Food' },
    ...(showWeights ? [{ to: '/weights', icon: Dumbbell, label: 'Exercise' }] : []),
    ...(showCustomLogs ? [{ to: '/other', icon: ClipboardList, label: 'Other' }] : []),
    { to: '/history', icon: CalendarDays, label: 'Calendar' },
    { to: '/trends', icon: TrendingUp, label: 'Trends' },
    { to: '/settings', icon: Settings, label: 'Settings' },
    ...(showAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background md:static md:z-auto">
      <div className="mx-auto flex max-w-lg items-center justify-around border-t">
        {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs text-center">{label}</span>
            </NavLink>
        ))}
      </div>
    </nav>
  );
}
