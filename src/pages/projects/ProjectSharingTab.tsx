import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link2, Plus } from 'lucide-react';
import { useLinks } from '@/hooks/useLinks';
import { useProjectPermissions } from '@/hooks/usePermissions';
import { Button, EmptyState, Skeleton } from '@/components/ui';
import { ShareLinkWizard } from '@/components/sharing/ShareLinkWizard';
import { LinkCard } from '@/components/sharing/LinkCard';

export function ProjectSharingTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const { canShare } = useProjectPermissions(projectId);
  const { data: links, isLoading } = useLinks(projectId);
  const [wizardOpen, setWizardOpen] = useState(false);

  if (!projectId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Share links</h2>
          <p className="text-xs text-gray-500">Generate links to share files, folders, or the entire project.</p>
        </div>
        {canShare && (
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4" /> Create link
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : !links || links.length === 0 ? (
        <EmptyState
          icon={<Link2 className="h-5 w-5" />}
          title="No share links yet"
          description="Create a link to share files or folders with anyone, with optional password protection and expiration."
          action={canShare && <Button onClick={() => setWizardOpen(true)}>Create your first link</Button>}
        />
      ) : (
        <div className="space-y-3">
          {links.map((link) => <LinkCard key={link.id} link={link} projectId={projectId} />)}
        </div>
      )}

      <ShareLinkWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} projectId={projectId} />
    </div>
  );
}
