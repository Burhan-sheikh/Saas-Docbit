import { useNavigate } from 'react-router-dom';
import { FolderKanban, Users, HardDrive, MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { Dropdown, DropdownItem, Badge } from '@/components/ui';
import { formatBytes, formatRelativeTime } from '@/utils/format';
import type { ProjectWithStats } from '@/lib/api/projects';

interface ProjectCardProps {
  project: ProjectWithStats;
  view: 'grid' | 'list';
  onRename: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, view, onRename, onArchive, onRestore, onDelete }: ProjectCardProps) {
  const navigate = useNavigate();
  const isArchived = project.status === 'archived';

  const menu = (close: () => void) => (
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
  );

  if (view === 'list') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-brand-300">
        <button onClick={() => navigate(`/projects/${project.id}`)} className="flex flex-1 items-center gap-3 text-left">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <FolderKanban className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{project.name}</p>
            <p className="truncate text-xs text-gray-400">{formatRelativeTime(project.updated_at)}</p>
          </div>
        </button>
        <span className="hidden text-xs text-gray-400 sm:block">{formatBytes(project.stats.storage_used_bytes)}</span>
        <span className="hidden items-center gap-1 text-xs text-gray-400 sm:flex"><Users className="h-3.5 w-3.5" /> {project.stats.member_count}</span>
        {isArchived && <Badge variant="gray">Archived</Badge>}
        <Dropdown trigger={<button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><MoreHorizontal className="h-4 w-4" /></button>}>
          {menu}
        </Dropdown>
      </div>
    );
  }

  return (
    <div className="card group flex flex-col p-4 transition-colors hover:border-brand-300">
      <div className="flex items-start justify-between">
        <button onClick={() => navigate(`/projects/${project.id}`)} className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{project.name}</p>
            <p className="text-xs text-gray-400">{formatRelativeTime(project.updated_at)}</p>
          </div>
        </button>
        <Dropdown trigger={<button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><MoreHorizontal className="h-4 w-4" /></button>}>
          {menu}
        </Dropdown>
      </div>
      {project.description && <p className="mt-3 line-clamp-2 text-xs text-gray-500">{project.description}</p>}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><HardDrive className="h-3.5 w-3.5" /> {formatBytes(project.stats.storage_used_bytes)}</span>
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {project.stats.member_count}</span>
        {isArchived && <Badge variant="gray">Archived</Badge>}
      </div>
    </div>
  );
}
