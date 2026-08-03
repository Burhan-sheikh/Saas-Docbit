import { Copy, MoreHorizontal, RefreshCw, Copy as DuplicateIcon, Trash2, Lock, Clock, Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Dropdown, DropdownItem, Switch } from '@/components/ui';
import { linksApi } from '@/lib/api/links';
import { useToggleLink, useRegenerateLink, useDuplicateLink, useDeleteLink } from '@/hooks/useLinks';
import { formatDate, formatRelativeTime } from '@/utils/format';
import type { ProjectLink } from '@/types/database';

export function LinkCard({ link, projectId }: { link: ProjectLink; projectId: string }) {
  const toggleLink = useToggleLink(projectId);
  const regenerateLink = useRegenerateLink(projectId);
  const duplicateLink = useDuplicateLink(projectId);
  const deleteLink = useDeleteLink(projectId);

  const url = linksApi.buildShareUrl(link.slug);
  const isExpired = link.expires_at && new Date(link.expires_at) < new Date();

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button onClick={copyUrl} className="flex items-center gap-1.5 truncate text-sm font-medium text-brand-700 hover:underline">
              {url} <Copy className="h-3 w-3 shrink-0" />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant={link.is_active && !isExpired ? 'green' : 'gray'}>{isExpired ? 'Expired' : link.is_active ? 'Active' : 'Disabled'}</Badge>
            <Badge variant="gray" className="capitalize">{link.target_type}</Badge>
            {link.password_hash && <Badge variant="purple"><Lock className="h-3 w-3" /> Password</Badge>}
            {link.require_login && <Badge variant="amber">Login required</Badge>}
            <Badge variant="gray">{link.permission === 'download' ? <Download className="h-3 w-3" /> : <Eye className="h-3 w-3" />} {link.permission}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span>{link.view_count} views</span>
            <span>{link.download_count} downloads{link.max_downloads ? ` / ${link.max_downloads}` : ''}</span>
            {link.expires_at && (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Expires {formatDate(link.expires_at)}</span>
            )}
            <span>Created {formatRelativeTime(link.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={link.is_active} onChange={(checked) => toggleLink.mutate({ id: link.id, isActive: checked })} />
          <Dropdown trigger={<button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><MoreHorizontal className="h-4 w-4" /></button>}>
            {(close) => (
              <>
                <DropdownItem onClick={() => { copyUrl(); close(); }}><Copy className="h-3.5 w-3.5" /> Copy link</DropdownItem>
                <DropdownItem onClick={() => { regenerateLink.mutate(link.id); close(); }}><RefreshCw className="h-3.5 w-3.5" /> Regenerate</DropdownItem>
                <DropdownItem onClick={() => { duplicateLink.mutate(link); close(); }}><DuplicateIcon className="h-3.5 w-3.5" /> Duplicate</DropdownItem>
                <DropdownItem danger onClick={() => { deleteLink.mutate(link.id); close(); }}><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownItem>
              </>
            )}
          </Dropdown>
        </div>
      </div>
    </div>
  );
}
