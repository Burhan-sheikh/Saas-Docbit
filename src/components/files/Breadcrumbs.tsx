import { ChevronRight, Home } from 'lucide-react';
import type { FileNode } from '@/types/database';

interface BreadcrumbsProps {
  path: FileNode[];
  onNavigate: (nodeId: string | null) => void;
}

export function Breadcrumbs({ path, onNavigate }: BreadcrumbsProps) {
  return (
    <div className="scrollbar-none flex items-center gap-1 overflow-x-auto text-sm">
      <button onClick={() => onNavigate(null)} className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
        <Home className="h-3.5 w-3.5" /> Project root
      </button>
      {path.map((node) => (
        <span key={node.id} className="flex shrink-0 items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          <button onClick={() => onNavigate(node.id)} className="rounded-lg px-2 py-1 font-medium text-gray-700 hover:bg-gray-100">
            {node.name}
          </button>
        </span>
      ))}
    </div>
  );
}
