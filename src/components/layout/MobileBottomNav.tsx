import { NavLink, useParams } from 'react-router-dom';
import { LayoutGrid, Building2, FolderKanban, Bell, CreditCard } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useWorkspaceContext } from '@/context/WorkspaceContext';
import { useUnreadCount } from '@/hooks/useNotifications';

export function MobileBottomNav() {
  const { activeWorkspaceId } = useWorkspaceContext();
  const { workspaceId } = useParams();
  const currentWorkspace = workspaceId || activeWorkspaceId;
  const { data: unread } = useUnreadCount();

  const items = [
    { to: '/overview', label: 'Overview', icon: LayoutGrid },
    { to: '/workspaces', label: 'Workspaces', icon: Building2 },
    { to: currentWorkspace ? `/workspaces/${currentWorkspace}` : '/workspaces', label: 'Projects', icon: FolderKanban },
    { to: '/notifications', label: 'Alerts', icon: Bell, badge: unread },
    { to: '/billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 flex border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
      {items.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            cn('relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium', isActive ? 'text-brand-600' : 'text-gray-400')
          }
        >
          <div className="relative">
            <item.icon className="h-5 w-5" />
            {Boolean(item.badge) && (
              <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {item.badge && item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </div>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
