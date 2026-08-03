import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { workspacesApi } from '@/lib/api/workspaces';
import { queryKeys } from './queryKeys';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/lib/integrations/analytics';

export function useWorkspaces(filters?: { status?: 'active' | 'archived'; search?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.workspaces(user?.id ?? '', filters),
    queryFn: () => workspacesApi.list(user!.id, filters),
    enabled: Boolean(user?.id),
  });
}

export function useWorkspace(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspace(id ?? ''),
    queryFn: () => workspacesApi.getById(id!),
    enabled: Boolean(id),
  });
}

export function useWorkspaceStats(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspaceStats(id ?? ''),
    queryFn: () => workspacesApi.getStats(id!),
    enabled: Boolean(id),
  });
}

export function useWorkspaceMembers(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspaceMembers(id ?? ''),
    queryFn: () => workspacesApi.listMembers(id!),
    enabled: Boolean(id),
  });
}

export function useCreateWorkspace() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      workspacesApi.create(user!.id, name, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      trackEvent('workspace_created');
      toast.success('Workspace created');
    },
    onError: (err: Error) => toast.error(err.message.includes('WORKSPACE_LIMIT_REACHED') ? 'Workspace limit reached for your plan' : 'Could not create workspace'),
  });
}

export function useRenameWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => workspacesApi.rename(id, name),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      qc.invalidateQueries({ queryKey: queryKeys.workspace(vars.id) });
      toast.success('Workspace renamed');
    },
    onError: () => toast.error('Could not rename workspace'),
  });
}

export function useUpdateWorkspaceDescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, description }: { id: string; description: string }) => workspacesApi.updateDescription(id, description),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.workspace(vars.id) });
      toast.success('Description updated');
    },
  });
}

export function useArchiveWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspacesApi.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace archived');
    },
  });
}

export function useRestoreWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspacesApi.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace restored');
    },
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspacesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace deleted');
    },
  });
}

export function useToggleFavoriteWorkspace() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, isFavorite }: { workspaceId: string; isFavorite: boolean }) =>
      workspacesApi.toggleFavorite(workspaceId, user!.id, isFavorite),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}
