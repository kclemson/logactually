import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-lg md:max-w-2xl px-4 pb-20 pt-4 md:pb-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
