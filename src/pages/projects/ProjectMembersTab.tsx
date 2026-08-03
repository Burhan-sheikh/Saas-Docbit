import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlus, Users, ShieldAlert } from 'lucide-react';
import { useProjectMembers, usePermissionRequests } from '@/hooks/useMembers';
import { useProjectPermissions } from '@/hooks/usePermissions';
import { Button, EmptyState, Skeleton } from '@/components/ui';
import { InviteMembersModal } from '@/components/members/InviteMembersModal';
import { MemberRow } from '@/components/members/MemberRow';
import { PermissionRequestRow } from '@/components/members/PermissionRequestRow';

export function ProjectMembersTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const { canManageMembers } = useProjectPermissions(projectId);
  const { data: members, isLoading } = useProjectMembers(projectId);
  const { data: requests } = usePermissionRequests(projectId);
  const [inviteOpen, setInviteOpen] = useState(false);

  if (!projectId) return null;

  const acceptedMembers = (members ?? []).filter((m) => m.accepted);
  const pendingMembers = (members ?? []).filter((m) => !m.accepted);
  const pendingRequests = (requests ?? []).filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6">
      {canManageMembers && pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <ShieldAlert className="h-4 w-4 text-amber-500" /> Access requests ({pendingRequests.length})
          </h2>
          {pendingRequests.map((r) => <PermissionRequestRow key={r.id} request={r} projectId={projectId} />)}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Members</h2>
        {canManageMembers && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Invite members
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      ) : acceptedMembers.length === 0 ? (
        <EmptyState icon={<Users className="h-5 w-5" />} title="No members yet" />
      ) : (
        <div className="space-y-2">
          {acceptedMembers.map((m) => <MemberRow key={m.id} member={m} projectId={projectId} canManage={canManageMembers} />)}
        </div>
      )}

      {pendingMembers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Pending invitations</h2>
          <div className="space-y-2">
            {pendingMembers.map((m) => <MemberRow key={m.id} member={m} projectId={projectId} canManage={canManageMembers} />)}
          </div>
        </div>
      )}

      <InviteMembersModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} projectId={projectId} />
    </div>
  );
}
