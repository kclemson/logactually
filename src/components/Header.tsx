import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/lib/constants';

export function Header() {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-3 border-b">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="" className="w-6 h-6" />
          <h1 className="text-title text-foreground">{APP_NAME}</h1>
        </div>
        <button
          onClick={() => signOut()}
          className="text-muted-foreground hover:text-foreground hover:underline min-h-[44px] px-2 -mr-2"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
