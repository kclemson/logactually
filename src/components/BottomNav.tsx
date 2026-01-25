import { NavLink } from 'react-router-dom';
import { PenLine, CalendarDays, TrendingUp, Settings, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export function BottomNav() {
  const { data: isAdmin } = useIsAdmin();
  
  // Show admin if in dev mode OR if user has admin role
  const showAdmin = import.meta.env.DEV || isAdmin;

  const navItems = [
    { to: '/', icon: PenLine, label: 'Log Food' },
    { to: '/history', icon: CalendarDays, label: 'Calendar' },
    { to: '/trends', icon: TrendingUp, label: 'Trends' },
    { to: '/settings', icon: Settings, label: 'Settings' },
    ...(showAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:static md:z-auto">
      <div className="mx-auto flex max-w-lg items-center justify-around">
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
              <span className="text-xs">{label}</span>
            </NavLink>
        ))}
      </div>
    </nav>
  );
}
