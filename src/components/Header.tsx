import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { useHasUnreadResponses } from '@/hooks/feedback';

export function Header() {
  const { data: hasUnread } = useHasUnreadResponses();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-3 border-b">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="" className="w-6 h-6" />
          <h1 className="text-title text-foreground">{APP_NAME}</h1>
        </div>
        <Link
          to="/help"
          className="text-muted-foreground hover:text-foreground min-h-[44px] px-2 -mr-2 flex items-center gap-1"
        >
          <div className="relative">
            <HelpCircle className="h-4 w-4" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[hsl(217_91%_60%)] ring-2 ring-background" />
            )}
          </div>
          <span className="text-sm">Help</span>
        </Link>
      </div>
    </header>
  );
}
