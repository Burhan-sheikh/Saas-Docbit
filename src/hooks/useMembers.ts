import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { membersApi } from '@/lib/api/members';
import { queryKeys } from './queryKeys';
import { useAuth } from '@/context/AuthContext';
import type { ProjectRole } from '@/types/database';

export function useProjectMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.members(projectId ?? ''),
    queryFn: () => membersApi.list(projectId!),
    enabled: Boolean(projectId),
  });
}

export function usePermissionRequests(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.permissionRequests(projectId ?? ''),
    queryFn: () => membersApi.listPermissionRequests(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useInviteMembers(projectId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ emails, role }: { emails: string[]; role: ProjectRole }) =>
      membersApi.inviteMany(projectId, emails, role, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members(projectId) });
      toast.success('Invitations sent');
    },
  });
}

export function useUpdateMemberRole(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: ProjectRole }) => membersApi.updateRole(memberId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members(projectId) });
      toast.success('Role updated');
    },
  });
}

export function useRemoveMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => membersApi.remove(memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members(projectId) });
      toast.success('Member removed');
    },
  });
}

export function useCreatePermissionRequest(projectId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => membersApi.createPermissionRequest(projectId, user!.id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.permissionRequests(projectId) });
      toast.success('Request sent to the project owner');
    },
  });
}

export function useResolvePermissionRequest(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, approve, role }: { requestId: string; approve: boolean; role?: ProjectRole }) =>
      membersApi.resolvePermissionRequest(requestId, approve, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.permissionRequests(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.members(projectId) });
      toast.success('Request resolved');
    },
  });
}
