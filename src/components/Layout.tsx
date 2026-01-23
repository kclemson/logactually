import { forwardRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export const Layout = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-lg px-4 pb-20 pt-4 md:max-w-2xl md:pb-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
});

Layout.displayName = 'Layout';
