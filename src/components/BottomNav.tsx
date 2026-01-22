import { NavLink } from 'react-router-dom';
import { PenLine, CalendarDays, TrendingUp, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: PenLine, label: 'Log' },
  { to: '/today', icon: CalendarDays, label: 'Today' },
  { to: '/trends', icon: TrendingUp, label: 'Trends' },
  { to: '/history', icon: History, label: 'History' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
