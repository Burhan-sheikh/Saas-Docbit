import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { useRealtimeNotifications } from '@/hooks/useNotifications';

export function AppShell() {
  useRealtimeNotifications();

  return (
    <div className="flex h-full w-full overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
