import { useNavigate } from 'react-router-dom';
import { FolderPlus, Building2, Upload, Link2 } from 'lucide-react';
import { useWorkspaceContext } from '@/context/WorkspaceContext';

export function QuickActions({ onCreateWorkspace, onCreateProject }: { onCreateWorkspace: () => void; onCreateProject: () => void }) {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspaceContext();

  const actions = [
    { label: 'New workspace', icon: Building2, onClick: onCreateWorkspace },
    { label: 'New project', icon: FolderPlus, onClick: onCreateProject },
    {
      label: 'Upload files',
      icon: Upload,
      onClick: () => navigate(activeWorkspaceId ? `/workspaces/${activeWorkspaceId}` : '/workspaces'),
    },
    {
      label: 'Share content',
      icon: Link2,
      onClick: () => navigate(activeWorkspaceId ? `/workspaces/${activeWorkspaceId}` : '/workspaces'),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className="card flex flex-col items-center gap-2 p-4 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <action.icon className="h-4 w-4" />
          </div>
          <span className="text-xs font-medium text-gray-700">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
