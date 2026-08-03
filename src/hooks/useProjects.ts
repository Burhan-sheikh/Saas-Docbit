import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { projectsApi } from '@/lib/api/projects';
import { queryKeys } from './queryKeys';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/lib/integrations/analytics';

export function useProjects(workspaceId: string | undefined, filters?: { status?: 'active' | 'archived'; search?: string; sort?: 'name' | 'updated_at' | 'created_at'; order?: 'asc' | 'desc' }) {
  return useQuery({
    queryKey: queryKeys.projects(workspaceId ?? '', filters),
    queryFn: () => projectsApi.list(workspaceId!, filters),
    enabled: Boolean(workspaceId),
  });
}

export function useRecentProjects(limit = 6) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.recentProjects(user?.id ?? ''),
    queryFn: () => projectsApi.listRecent(user!.id, limit),
    enabled: Boolean(user?.id),
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.project(id ?? ''),
    queryFn: () => projectsApi.getById(id!),
    enabled: Boolean(id),
  });
}

export function useProjectStats(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projectStats(id ?? ''),
    queryFn: () => projectsApi.getStats(id!),
    enabled: Boolean(id),
    refetchInterval: 15000,
  });
}

export function useCreateProject() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, name, description, icon }: { workspaceId: string; name: string; description?: string; icon?: string }) =>
      projectsApi.create(workspaceId, user!.id, name, description, icon),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      trackEvent('project_created');
      toast.success('Project created');
    },
    onError: (err: Error) => toast.error(err.message.includes('PROJECT_LIMIT_REACHED') ? 'Project limit reached for your plan' : 'Could not create project'),
  });
}

export function useRenameProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => projectsApi.rename(id, name),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: queryKeys.project(vars.id) });
      toast.success('Project renamed');
    },
  });
}

export function useUpdateProjectDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { description?: string; icon?: string } }) =>
      projectsApi.updateDetails(id, updates),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.project(vars.id) });
      toast.success('Project updated');
    },
  });
}

export function useMoveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, workspaceId }: { id: string; workspaceId: string }) => projectsApi.moveToWorkspace(id, workspaceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project moved');
    },
  });
}

export function useArchiveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project archived');
    },
  });
}

export function useRestoreProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project restored');
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
  });
}
