import { NavLink, useParams } from 'react-router-dom';
import { LayoutGrid, FolderKanban, Building2, CreditCard, Settings, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';
import { useWorkspaceContext } from '@/context/WorkspaceContext';

const navItems = [
  { to: '/overview', label: 'Overview', icon: LayoutGrid },
  { to: '/workspaces', label: 'Workspaces', icon: Building2 },
  { to: '/billing', label: 'Billing', icon: CreditCard },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { activeWorkspaceId } = useWorkspaceContext();
  const { workspaceId } = useParams();
  const currentWorkspace = workspaceId || activeWorkspaceId;

  return (
    <aside
      className={cn(
        'safe-top hidden h-full shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-200 md:flex',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">S</div>
        {!collapsed && <span className="text-sm font-semibold text-gray-900">SaaS Platform</span>}
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {currentWorkspace && (
          <NavLink
            to={`/workspaces/${currentWorkspace}`}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
              )
            }
          >
            <FolderKanban className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Projects</span>}
          </NavLink>
        )}
      </nav>

      <div className="space-y-0.5 px-2 pb-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100')
          }
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
