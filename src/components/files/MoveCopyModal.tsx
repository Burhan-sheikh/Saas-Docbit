import { useState } from 'react';
import { Folder, Home } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { useFileNodes } from '@/hooks/useFiles';
import { cn } from '@/utils/cn';

interface MoveCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  mode: 'move' | 'copy';
  onConfirm: (destinationId: string | null) => void;
  isLoading: boolean;
}

export function MoveCopyModal({ isOpen, onClose, projectId, mode, onConfirm, isLoading }: MoveCopyModalProps) {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const { data: nodes } = useFileNodes(projectId, currentFolder);
  const folders = (nodes ?? []).filter((n) => n.type === 'folder');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'move' ? 'Move to…' : 'Copy to…'} description="Choose a destination folder">
      <div className="space-y-3">
        <button
          onClick={() => setCurrentFolder(null)}
          className={cn('flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm', currentFolder === null ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50 text-gray-700')}
        >
          <Home className="h-4 w-4" /> Project root
        </button>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setCurrentFolder(folder.id)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <Folder className="h-4 w-4 text-brand-500" /> {folder.name}
            </button>
          ))}
          {folders.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No subfolders here.</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(currentFolder)} isLoading={isLoading}>
            {mode === 'move' ? 'Move here' : 'Copy here'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
