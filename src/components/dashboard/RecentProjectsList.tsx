import { useNavigate } from 'react-router-dom';
import { FolderKanban, FileText } from 'lucide-react';
import { EmptyState, Skeleton } from '@/components/ui';
import { formatRelativeTime, formatBytes } from '@/utils/format';
import type { ProjectWithStats } from '@/lib/api/projects';

export function RecentProjectsList({ projects, isLoading }: { projects?: ProjectWithStats[]; isLoading: boolean }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderKanban className="h-5 w-5" />}
        title="No projects yet"
        description="Create a workspace and your first project to get started."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {projects.map((project) => (
        <button
          key={project.id}
          onClick={() => navigate(`/projects/${project.id}`)}
          className="card flex items-start gap-3 p-4 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/30"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{project.name}</p>
            <p className="mt-0.5 truncate text-xs text-gray-500">{project.workspace_name}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" /> {project.stats.file_count}
              </span>
              <span>{formatBytes(project.stats.storage_used_bytes)}</span>
              <span>{formatRelativeTime(project.updated_at)}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
