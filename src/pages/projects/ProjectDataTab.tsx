import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LayoutGrid, List, Search, FolderPlus, Trash2, ArrowUpDown } from 'lucide-react';
import { useFileNodes, useFileSearch, useBreadcrumbs, useDeleteNodes, useMoveNodes, useCopyNodes } from '@/hooks/useFiles';
import { useDebounce } from '@/hooks/useDebounce';
import { useProjectPermissions } from '@/hooks/usePermissions';
import { Button, Input, Select, Tabs, EmptyState } from '@/components/ui';
import { Breadcrumbs } from '@/components/files/Breadcrumbs';
import { FileGrid } from '@/components/files/FileGrid';
import { FileListView } from '@/components/files/FileListView';
import { UploadDropzone } from '@/components/files/UploadDropzone';
import { BulkActionsBar } from '@/components/files/BulkActionsBar';
import { CreateFolderModal } from '@/components/files/CreateFolderModal';
import { RenameNodeModal } from '@/components/files/RenameNodeModal';
import { MoveCopyModal } from '@/components/files/MoveCopyModal';
import { FilePreviewModal } from '@/components/files/FilePreviewModal';
import { TrashPanel } from '@/components/files/TrashPanel';
import type { FileNode } from '@/types/database';

type SortKey = 'name' | 'updated_at' | 'size_bytes';

export function ProjectDataTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const { canUpload, canDelete } = useProjectPermissions(projectId);

  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [showTrash, setShowTrash] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewNode, setPreviewNode] = useState<FileNode | null>(null);
  const [renameNode, setRenameNode] = useState<FileNode | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [moveCopyMode, setMoveCopyMode] = useState<'move' | 'copy' | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const isSearching = debouncedSearch.trim().length > 0;

  const { data: folderNodes, isLoading: folderLoading } = useFileNodes(projectId, currentFolder);
  const { data: searchResults, isLoading: searchLoading } = useFileSearch(projectId, debouncedSearch);
  const { data: breadcrumbPath } = useBreadcrumbs(currentFolder);

  const deleteNodes = useDeleteNodes(projectId!);
  const moveNodes = useMoveNodes(projectId!);
  const copyNodes = useCopyNodes(projectId!);

  const nodes = isSearching ? searchResults ?? [] : folderNodes ?? [];
  const isLoading = isSearching ? searchLoading : folderLoading;

  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'size_bytes') return b.size_bytes - a.size_bytes;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [nodes, sort]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleOpen = (node: FileNode) => {
    if (node.type === 'folder') {
      setCurrentFolder(node.id);
      setSelectedIds(new Set());
    } else {
      setPreviewNode(node);
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  if (!projectId) return null;

  return (
    <div className="space-y-4">
      <Tabs
        tabs={[{ value: 'files', label: 'Files' }, { value: 'trash', label: 'Trash' }]}
        value={showTrash ? 'trash' : 'files'}
        onChange={(v) => setShowTrash(v === 'trash')}
      />

      {showTrash ? (
        <TrashPanel projectId={projectId} />
      ) : (
        <>
          {canUpload && <UploadDropzone projectId={projectId} parentId={currentFolder} />}

          {!isSearching && <Breadcrumbs path={breadcrumbPath ?? []} onNavigate={setCurrentFolder} />}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input placeholder="Search this project…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
            <div className="flex items-center gap-2">
              <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="w-auto">
                <option value="name">Name</option>
                <option value="updated_at">Last modified</option>
                <option value="size_bytes">Size</option>
              </Select>
              {canUpload && !isSearching && (
                <Button variant="outline" size="sm" onClick={() => setCreateFolderOpen(true)}>
                  <FolderPlus className="h-3.5 w-3.5" /> New folder
                </Button>
              )}
              <div className="flex overflow-hidden rounded-lg border border-gray-300">
                <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}><LayoutGrid className="h-4 w-4" /></button>
                <button onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}><List className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
          ) : sortedNodes.length === 0 ? (
            <EmptyState
              icon={<ArrowUpDown className="h-5 w-5" />}
              title={isSearching ? 'No matching files' : 'This folder is empty'}
              description={isSearching ? 'Try a different search term.' : 'Upload files or create a folder to get started.'}
            />
          ) : view === 'grid' ? (
            <FileGrid nodes={sortedNodes} selectedIds={selectedIds} onToggleSelect={toggleSelect} onOpen={handleOpen} />
          ) : (
            <FileListView
              nodes={sortedNodes}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onOpen={handleOpen}
              onSelectAll={() => setSelectedIds(selectedIds.size === sortedNodes.length ? new Set() : new Set(sortedNodes.map((n) => n.id)))}
              allSelected={selectedIds.size > 0 && selectedIds.size === sortedNodes.length}
            />
          )}

          {selectedIds.size > 0 && canDelete && (
            <BulkActionsBar
              count={selectedIds.size}
              onClear={clearSelection}
              onMove={() => setMoveCopyMode('move')}
              onCopy={() => setMoveCopyMode('copy')}
              onDelete={() => {
                deleteNodes.mutate(Array.from(selectedIds));
                clearSelection();
              }}
            />
          )}
        </>
      )}

      <CreateFolderModal isOpen={createFolderOpen} onClose={() => setCreateFolderOpen(false)} projectId={projectId} parentId={currentFolder} />
      {renameNode && <RenameNodeModal isOpen onClose={() => setRenameNode(null)} projectId={projectId} node={renameNode} />}
      <FilePreviewModal node={previewNode} onClose={() => setPreviewNode(null)} />
      {moveCopyMode && (
        <MoveCopyModal
          isOpen
          onClose={() => setMoveCopyMode(null)}
          projectId={projectId}
          mode={moveCopyMode}
          isLoading={moveNodes.isPending || copyNodes.isPending}
          onConfirm={(destinationId) => {
            const ids = Array.from(selectedIds);
            if (moveCopyMode === 'move') moveNodes.mutate({ ids, newParentId: destinationId });
            else copyNodes.mutate({ ids, newParentId: destinationId });
            setMoveCopyMode(null);
            clearSelection();
          }}
        />
      )}
    </div>
  );
}
