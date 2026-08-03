import { Trash2, RotateCcw, XCircle } from 'lucide-react';
import { useFileTrash, useRestoreNodes, usePermanentDeleteNodes } from '@/hooks/useFiles';
import { EmptyState, Button } from '@/components/ui';
import { FileIcon } from './FileIcon';
import { formatRelativeTime } from '@/utils/format';

export function TrashPanel({ projectId }: { projectId: string }) {
  const { data: trashedNodes, isLoading } = useFileTrash(projectId);
  const restoreNodes = useRestoreNodes(projectId);
  const permanentDelete = usePermanentDeleteNodes(projectId);

  if (isLoading) return null;

  if (!trashedNodes || trashedNodes.length === 0) {
    return <EmptyState icon={<Trash2 className="h-5 w-5" />} title="Trash is empty" description="Deleted files and folders will appear here for recovery." />;
  }

  return (
    <div className="space-y-2">
      {trashedNodes.map((node) => (
        <div key={node.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
          <FileIcon type={node.type} category={node.category} className="h-8 w-8 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-gray-800">{node.name}</p>
            <p className="text-xs text-gray-400">Deleted {node.deleted_at ? formatRelativeTime(node.deleted_at) : ''}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => restoreNodes.mutate([node.id])}>
            <RotateCcw className="h-3.5 w-3.5" /> Restore
          </Button>
          <Button size="sm" variant="ghost" onClick={() => permanentDelete.mutate([node.id])}>
            <XCircle className="h-3.5 w-3.5 text-red-500" />
          </Button>
        </div>
      ))}
    </div>
  );
}
