import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-lg md:max-w-2xl items-center justify-between px-4">
        <h1 className="text-title text-foreground">Log Actually</h1>
        <button
          onClick={() => signOut()}
          className="text-body text-muted-foreground hover:text-foreground hover:underline"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
