import { useNavigate } from 'react-router-dom';
import { Building2, Star, FolderKanban, Users, MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { Dropdown, DropdownItem, Badge } from '@/components/ui';
import { formatBytes, formatRelativeTime } from '@/utils/format';
import { useToggleFavoriteWorkspace } from '@/hooks/useWorkspaces';
import { cn } from '@/utils/cn';
import type { WorkspaceWithStats } from '@/lib/api/workspaces';

interface WorkspaceCardProps {
  workspace: WorkspaceWithStats;
  onRename: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export function WorkspaceCard({ workspace, onRename, onArchive, onRestore, onDelete }: WorkspaceCardProps) {
  const navigate = useNavigate();
  const toggleFavorite = useToggleFavoriteWorkspace();
  const isArchived = workspace.status === 'archived';

  return (
    <div className="card group relative flex flex-col p-4 transition-colors hover:border-brand-300">
      <div className="flex items-start justify-between">
        <button onClick={() => navigate(`/workspaces/${workspace.id}`)} className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{workspace.name}</p>
            <p className="text-xs text-gray-400">{formatRelativeTime(workspace.updated_at)}</p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleFavorite.mutate({ workspaceId: workspace.id, isFavorite: !workspace.is_favorite })}
            className="rounded-lg p-1.5 text-gray-300 hover:bg-gray-100 hover:text-amber-500"
          >
            <Star className={cn('h-4 w-4', workspace.is_favorite && 'fill-amber-400 text-amber-400')} />
          </button>
          <Dropdown
            trigger={
              <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
          >
            {(close) => (
              <>
                <DropdownItem onClick={() => { onRename(); close(); }}>
                  <Pencil className="h-3.5 w-3.5" /> Rename
                </DropdownItem>
                {isArchived ? (
                  <DropdownItem onClick={() => { onRestore(); close(); }}>
                    <ArchiveRestore className="h-3.5 w-3.5" /> Restore
                  </DropdownItem>
                ) : (
                  <DropdownItem onClick={() => { onArchive(); close(); }}>
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </DropdownItem>
                )}
                <DropdownItem danger onClick={() => { onDelete(); close(); }}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownItem>
              </>
            )}
          </Dropdown>
        </div>
      </div>

      {workspace.description && <p className="mt-3 line-clamp-2 text-xs text-gray-500">{workspace.description}</p>}

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><FolderKanban className="h-3.5 w-3.5" /> {workspace.stats.project_count}</span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {workspace.stats.member_count}</span>
        </div>
        <span className="text-xs text-gray-400">{formatBytes(workspace.stats.storage_used_bytes)}</span>
        {isArchived && <Badge variant="gray">Archived</Badge>}
      </div>
    </div>
  );
}
