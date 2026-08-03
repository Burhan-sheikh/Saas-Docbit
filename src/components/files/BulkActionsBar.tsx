import { Copy, FolderInput, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui';

interface BulkActionsBarProps {
  count: number;
  onClear: () => void;
  onMove: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export function BulkActionsBar({ count, onClear, onMove, onCopy, onDelete }: BulkActionsBarProps) {
  if (count === 0) return null;
  return (
    <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <button onClick={onClear} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        <span className="font-medium">{count} selected</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onMove}><FolderInput className="h-3.5 w-3.5" /> Move</Button>
        <Button variant="outline" size="sm" onClick={onCopy}><Copy className="h-3.5 w-3.5" /> Copy</Button>
        <Button variant="danger" size="sm" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
      </div>
    </div>
  );
}
