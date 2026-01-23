import { forwardRef } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export const Header = forwardRef<HTMLElement>((_, ref) => {
  const { signOut } = useAuth();

  return (
    <header
      ref={ref}
      className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <h1 className="text-title text-foreground">Food Log</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut()}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
