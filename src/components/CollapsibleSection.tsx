import { useState, type ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  /** Section title displayed in header */
  title: string;
  /** Icon displayed before title */
  icon: LucideIcon;
  /** Whether section is open by default (default: true) */
  defaultOpen?: boolean;
  /** Optional action element in header (e.g., "Add" button) */
  headerAction?: ReactNode;
  /** Section content */
  children: ReactNode;
  /** Optional className for outer container */
  className?: string;
  /** Storage key suffix for persisting state (uses title if not provided) */
  storageKey?: string;
}

/**
 * Collapsible section with icon, title, and optional header action.
 * Persists open/closed state to localStorage.
 */
export function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  headerAction,
  children,
  className,
  storageKey,
}: CollapsibleSectionProps) {
  const key = `section-${storageKey || title.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Initialize from localStorage or default
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return defaultOpen;
    const stored = localStorage.getItem(key);
    return stored !== null ? stored === 'true' : defaultOpen;
  });

  // Event-driven persist to localStorage
  const handleToggle = () => {
    const newValue = !isOpen;
    setIsOpen(newValue);
    
    if (newValue !== defaultOpen) {
      localStorage.setItem(key, String(newValue));
    } else {
      localStorage.removeItem(key);
    }
  };

  return (
    <section className={cn('space-y-3', className)}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon className="h-4 w-4" />
          <span>{title}</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isOpen ? 'rotate-0' : '-rotate-90'
            )}
          />
        </button>
        {headerAction}
      </div>

      {/* Content with smooth collapse */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div>{children}</div>
      </div>
    </section>
  );
}
