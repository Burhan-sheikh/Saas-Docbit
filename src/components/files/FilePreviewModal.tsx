import { Modal, Button, Badge } from '@/components/ui';
import { formatBytes, formatDate } from '@/utils/format';
import { isPreviewable } from '@/utils/fileCategory';
import { Download, FileWarning } from 'lucide-react';
import type { FileNode } from '@/types/database';

export function FilePreviewModal({ node, onClose }: { node: FileNode | null; onClose: () => void }) {
  if (!node) return null;
  const previewable = isPreviewable(node.mime_type);

  return (
    <Modal isOpen={Boolean(node)} onClose={onClose} title={node.name} size="lg">
      <div className="space-y-4">
        <div className="flex min-h-[240px] items-center justify-center rounded-xl bg-gray-50">
          {previewable && node.mime_type?.startsWith('image/') && node.storage_url ? (
            <img src={node.storage_url} alt={node.name} className="max-h-[420px] max-w-full rounded-lg object-contain" />
          ) : previewable && node.mime_type === 'application/pdf' && node.storage_url ? (
            <iframe title={node.name} src={node.storage_url} className="h-[420px] w-full rounded-lg" />
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
              <FileWarning className="h-8 w-8" />
              <p className="text-sm">Preview not available for this file type</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <Badge variant="gray">{formatBytes(node.size_bytes)}</Badge>
          <Badge variant="gray">{node.mime_type || 'Unknown type'}</Badge>
          <Badge variant="gray">Uploaded {formatDate(node.created_at)}</Badge>
        </div>

        {node.storage_url && (
          <a href={node.storage_url} download={node.name} target="_blank" rel="noreferrer">
            <Button fullWidth variant="outline">
              <Download className="h-4 w-4" /> Download
            </Button>
          </a>
        )}
      </div>
    </Modal>
  );
}
