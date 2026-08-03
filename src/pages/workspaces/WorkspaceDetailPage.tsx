import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FolderKanban, Plus, Search, LayoutGrid, List, Users, HardDrive } from 'lucide-react';
import { useWorkspace, useWorkspaceStats, useWorkspaceMembers } from '@/hooks/useWorkspaces';
import { useProjects, useArchiveProject, useRestoreProject, useDeleteProject } from '@/hooks/useProjects';
import { useDebounce } from '@/hooks/useDebounce';
import { useWorkspaceContext } from '@/context/WorkspaceContext';
import { Button, Input, Select, EmptyState, ConfirmDialog, Tabs, SkeletonCard, Avatar } from '@/components/ui';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { RenameProjectModal } from '@/components/projects/RenameProjectModal';
import { formatBytes } from '@/utils/format';
import type { ProjectWithStats } from '@/lib/api/projects';

export function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { setActiveWorkspaceId } = useWorkspaceContext();

  useEffect(() => {
    if (workspaceId) setActiveWorkspaceId(workspaceId);
  }, [workspaceId, setActiveWorkspaceId]);

  const { data: workspace } = useWorkspace(workspaceId);
  const { data: stats } = useWorkspaceStats(workspaceId);
  const { data: members } = useWorkspaceMembers(workspaceId);

  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'updated_at' | 'name' | 'created_at'>('updated_at');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const debouncedSearch = useDebounce(search, 300);

  const { data: projects, isLoading } = useProjects(workspaceId, { status, search: debouncedSearch, sort });
  const archiveProject = useArchiveProject();
  const restoreProject = useRestoreProject();
  const deleteProject = useDeleteProject();

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ProjectWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectWithStats | null>(null);

  const sortedProjects = useMemo(() => projects ?? [], [projects]);

  if (!workspace) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{workspace.name}</h1>
          {workspace.description && <p className="mt-1 text-sm text-gray-500">{workspace.description}</p>}
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New project
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-3">
          <p className="text-xs text-gray-500">Projects</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-gray-900">
            <FolderKanban className="h-4 w-4 text-brand-600" /> {stats?.project_count ?? 0}
          </p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-500">Members</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-gray-900">
            <Users className="h-4 w-4 text-purple-600" /> {stats?.member_count ?? 0}
          </p>
        </div>
        <div className="card col-span-2 p-3 sm:col-span-2">
          <p className="text-xs text-gray-500">Storage used</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-gray-900">
            <HardDrive className="h-4 w-4 text-emerald-600" /> {formatBytes(stats?.storage_used_bytes ?? 0)}
          </p>
        </div>
      </div>

      {members && members.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {members.slice(0, 6).map((m) => (
              <Avatar key={m.id} name={m.profile?.full_name} email={m.profile?.email} src={m.profile?.avatar_url} size="sm" className="ring-2 ring-white" />
            ))}
          </div>
          <span className="text-xs text-gray-500">{members.length} member{members.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      <Tabs tabs={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]} value={status} onChange={(v) => setStatus(v as 'active' | 'archived')} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input placeholder="Search projects…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="sm:max-w-[160px]">
          <option value="updated_at">Recently updated</option>
          <option value="created_at">Recently created</option>
          <option value="name">Name</option>
        </Select>
        <div className="flex overflow-hidden rounded-lg border border-gray-300">
          <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}><List className="h-4 w-4" /></button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : sortedProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-5 w-5" />}
          title={status === 'archived' ? 'No archived projects' : 'No projects yet'}
          description={status === 'active' ? 'Create your first project in this workspace.' : undefined}
          action={status === 'active' && <Button onClick={() => setCreateOpen(true)}>Create project</Button>}
        />
      ) : (
        <div className={view === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-2'}>
          {sortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              view={view}
              onRename={() => setRenameTarget(project)}
              onArchive={() => archiveProject.mutate(project.id)}
              onRestore={() => restoreProject.mutate(project.id)}
              onDelete={() => setDeleteTarget(project)}
            />
          ))}
        </div>
      )}

      <CreateProjectModal isOpen={createOpen} onClose={() => setCreateOpen(false)} defaultWorkspaceId={workspaceId} />
      {renameTarget && <RenameProjectModal isOpen onClose={() => setRenameTarget(null)} project={renameTarget} />}
      {deleteTarget && (
        <ConfirmDialog
          isOpen
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { deleteProject.mutate(deleteTarget.id); setDeleteTarget(null); }}
          title="Delete project"
          description={`This will permanently delete "${deleteTarget.name}" and all of its files. This action cannot be undone.`}
          confirmLabel="Delete"
          isDanger
          isLoading={deleteProject.isPending}
        />
      )}
    </div>
  );
}
