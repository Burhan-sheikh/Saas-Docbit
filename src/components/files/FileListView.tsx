import { FileIcon } from './FileIcon';
import { Checkbox } from '@/components/ui';
import { formatBytes, formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { FileNode } from '@/types/database';

interface FileListViewProps {
  nodes: FileNode[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (node: FileNode) => void;
  onSelectAll: () => void;
  allSelected: boolean;
}

export function FileListView({ nodes, selectedIds, onToggleSelect, onOpen, onSelectAll, allSelected }: FileListViewProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">
        <Checkbox checked={allSelected} onChange={onSelectAll} />
        <span className="flex-1">Name</span>
        <span className="hidden w-24 sm:block">Size</span>
        <span className="hidden w-32 sm:block">Modified</span>
      </div>
      {nodes.map((node) => {
        const selected = selectedIds.has(node.id);
        return (
          <div
            key={node.id}
            onClick={() => onOpen(node)}
            className={cn('flex cursor-pointer items-center gap-3 border-b border-gray-50 px-4 py-2.5 last:border-b-0 hover:bg-gray-50', selected && 'bg-brand-50/50')}
          >
            <Checkbox checked={selected} onChange={(e) => { e.stopPropagation(); onToggleSelect(node.id); }} onClick={(e) => e.stopPropagation()} />
            <FileIcon type={node.type} category={node.category} className="h-8 w-8 shrink-0" />
            <span className="flex-1 truncate text-sm text-gray-800">{node.name}</span>
            <span className="hidden w-24 shrink-0 text-xs text-gray-400 sm:block">{node.type === 'file' ? formatBytes(node.size_bytes) : '—'}</span>
            <span className="hidden w-32 shrink-0 text-xs text-gray-400 sm:block">{formatRelativeTime(node.updated_at)}</span>
          </div>
        );
      })}
    </div>
  );
}
