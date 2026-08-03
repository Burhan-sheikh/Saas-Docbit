import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { linksApi, type CreateLinkInput } from '@/lib/api/links';
import { queryKeys } from './queryKeys';
import { trackEvent } from '@/lib/integrations/analytics';
import type { ProjectLink } from '@/types/database';

export function useLinks(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.links(projectId ?? ''),
    queryFn: () => linksApi.list(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useCreateLink(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateLinkInput, 'projectId'>) => linksApi.create({ ...input, projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.links(projectId) });
      trackEvent('share_link_created');
      toast.success('Share link created');
    },
  });
}

export function useUpdateLink(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProjectLink> }) => linksApi.update(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.links(projectId) });
      toast.success('Link updated');
    },
  });
}

export function useToggleLink(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => linksApi.toggleActive(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.links(projectId) }),
  });
}

export function useRegenerateLink(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => linksApi.regenerateSlug(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.links(projectId) });
      toast.success('Link regenerated');
    },
  });
}

export function useDuplicateLink(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (link: ProjectLink) => linksApi.duplicate(link),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.links(projectId) });
      toast.success('Link duplicated');
    },
  });
}

export function useDeleteLink(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => linksApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.links(projectId) });
      toast.success('Link deleted');
    },
  });
}
