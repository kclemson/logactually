import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { DevToolsPanel } from './DevToolsPanel';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-lg px-3 pb-20 pt-4 md:pb-8">
        <Outlet />
      </main>
      <BottomNav />
      {import.meta.env.DEV && <DevToolsPanel />}
    </div>
  );
}
