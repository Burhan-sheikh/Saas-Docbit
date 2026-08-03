import { FileIcon } from './FileIcon';
import { Checkbox } from '@/components/ui';
import { formatBytes, formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { FileNode } from '@/types/database';

interface FileGridProps {
  nodes: FileNode[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (node: FileNode) => void;
}

export function FileGrid({ nodes, selectedIds, onToggleSelect, onOpen }: FileGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {nodes.map((node) => {
        const selected = selectedIds.has(node.id);
        return (
          <div
            key={node.id}
            onClick={() => onOpen(node)}
            className={cn(
              'group relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors',
              selected ? 'border-brand-400 bg-brand-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <div className="absolute left-2 top-2 opacity-0 transition-opacity group-hover:opacity-100" style={{ opacity: selected ? 1 : undefined }}>
              <Checkbox
                checked={selected}
                onChange={(e) => { e.stopPropagation(); onToggleSelect(node.id); }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <FileIcon type={node.type} category={node.category} className="h-12 w-12" />
            <div className="w-full">
              <p className="truncate text-xs font-medium text-gray-800">{node.name}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {node.type === 'file' ? formatBytes(node.size_bytes) : 'Folder'} · {formatRelativeTime(node.updated_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
