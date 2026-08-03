import { useMemo, useState } from 'react';
import { Building2, Plus, Search, Star } from 'lucide-react';
import { useWorkspaces, useArchiveWorkspace, useRestoreWorkspace, useDeleteWorkspace } from '@/hooks/useWorkspaces';
import { useDebounce } from '@/hooks/useDebounce';
import { Button, Input, Select, EmptyState, ConfirmDialog, Tabs, SkeletonCard } from '@/components/ui';
import { WorkspaceCard } from '@/components/workspaces/WorkspaceCard';
import { CreateWorkspaceModal } from '@/components/workspaces/CreateWorkspaceModal';
import { RenameWorkspaceModal } from '@/components/workspaces/RenameWorkspaceModal';
import type { WorkspaceWithStats } from '@/lib/api/workspaces';

type SortKey = 'updated_at' | 'name' | 'created_at';

export function WorkspacesPage() {
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('updated_at');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data: workspaces, isLoading } = useWorkspaces({ status, search: debouncedSearch });
  const archiveWorkspace = useArchiveWorkspace();
  const restoreWorkspace = useRestoreWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<WorkspaceWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceWithStats | null>(null);

  const sorted = useMemo(() => {
    let list = workspaces ?? [];
    if (favoritesOnly) list = list.filter((w) => w.is_favorite);
    return [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      return new Date(b[sort]).getTime() - new Date(a[sort]).getTime();
    });
  }, [workspaces, sort, favoritesOnly]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Workspaces</h1>
          <p className="mt-1 text-sm text-gray-500">Organize your projects into workspaces for your teams.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New workspace
        </Button>
      </div>

      <Tabs
        tabs={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]}
        value={status}
        onChange={(v) => setStatus(v as 'active' | 'archived')}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input placeholder="Search workspaces…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="sm:max-w-[160px]">
          <option value="updated_at">Recently updated</option>
          <option value="created_at">Recently created</option>
          <option value="name">Name</option>
        </Select>
        <button
          onClick={() => setFavoritesOnly((f) => !f)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${favoritesOnly ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
        >
          <Star className={`h-4 w-4 ${favoritesOnly ? 'fill-amber-400' : ''}`} /> Favorites
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title={status === 'archived' ? 'No archived workspaces' : 'No workspaces yet'}
          description={status === 'active' ? 'Create your first workspace to start organizing projects.' : undefined}
          action={status === 'active' && <Button onClick={() => setCreateOpen(true)}>Create workspace</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onRename={() => setRenameTarget(workspace)}
              onArchive={() => archiveWorkspace.mutate(workspace.id)}
              onRestore={() => restoreWorkspace.mutate(workspace.id)}
              onDelete={() => setDeleteTarget(workspace)}
            />
          ))}
        </div>
      )}

      <CreateWorkspaceModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      {renameTarget && <RenameWorkspaceModal isOpen onClose={() => setRenameTarget(null)} workspace={renameTarget} />}
      {deleteTarget && (
        <ConfirmDialog
          isOpen
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { deleteWorkspace.mutate(deleteTarget.id); setDeleteTarget(null); }}
          title="Delete workspace"
          description={`This will permanently delete "${deleteTarget.name}" and all of its projects. This action cannot be undone.`}
          confirmLabel="Delete"
          isDanger
          isLoading={deleteWorkspace.isPending}
        />
      )}
    </div>
  );
}
