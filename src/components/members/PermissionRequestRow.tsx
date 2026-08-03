import { Avatar, Button, Select } from '@/components/ui';
import { useResolvePermissionRequest } from '@/hooks/useMembers';
import { formatRelativeTime } from '@/utils/format';
import { useState } from 'react';
import type { ProjectPermissionRequest, ProjectRole } from '@/types/database';

export function PermissionRequestRow({ request, projectId }: { request: ProjectPermissionRequest; projectId: string }) {
  const resolveRequest = useResolvePermissionRequest(projectId);
  const [role, setRole] = useState<ProjectRole>('viewer');

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 sm:flex-row sm:items-center">
      <Avatar name={request.requester?.full_name} email={request.requester?.email} src={request.requester?.avatar_url} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{request.requester?.full_name || request.requester?.email}</p>
        {request.reason && <p className="text-xs text-gray-500">"{request.reason}"</p>}
        <p className="text-xs text-gray-400">{formatRelativeTime(request.created_at)}</p>
      </div>
      <div className="flex items-center gap-2">
        <Select value={role} onChange={(e) => setRole(e.target.value as ProjectRole)} className="w-28">
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
        </Select>
        <Button size="sm" variant="outline" onClick={() => resolveRequest.mutate({ requestId: request.id, approve: false })}>
          Deny
        </Button>
        <Button size="sm" onClick={() => resolveRequest.mutate({ requestId: request.id, approve: true, role })}>
          Approve
        </Button>
      </div>
    </div>
  );
}
