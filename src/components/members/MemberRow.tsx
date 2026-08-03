import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Avatar, Badge, Dropdown, DropdownItem, Select } from '@/components/ui';
import { useUpdateMemberRole, useRemoveMember } from '@/hooks/useMembers';
import type { ProjectMember, ProjectRole } from '@/types/database';

export function MemberRow({ member, projectId, canManage }: { member: ProjectMember; projectId: string; canManage: boolean }) {
  const updateRole = useUpdateMemberRole(projectId);
  const removeMember = useRemoveMember(projectId);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <Avatar name={member.profile?.full_name} email={member.profile?.email || member.invited_email} src={member.profile?.avatar_url} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{member.profile?.full_name || member.invited_email || 'Pending invite'}</p>
        <p className="truncate text-xs text-gray-400">{member.profile?.email || member.invited_email}</p>
      </div>
      {!member.accepted && <Badge variant="yellow">Pending</Badge>}
      {member.role === 'owner' ? (
        <Badge variant="brand">Owner</Badge>
      ) : canManage ? (
        <Select
          value={member.role}
          onChange={(e) => updateRole.mutate({ memberId: member.id, role: e.target.value as ProjectRole })}
          className="w-28"
        >
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </Select>
      ) : (
        <Badge variant="gray" className="capitalize">{member.role}</Badge>
      )}
      {canManage && member.role !== 'owner' && (
        <Dropdown trigger={<button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><MoreHorizontal className="h-4 w-4" /></button>}>
          {(close) => (
            <DropdownItem danger onClick={() => { removeMember.mutate(member.id); close(); }}>
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </DropdownItem>
          )}
        </Dropdown>
      )}
    </div>
  );
}
