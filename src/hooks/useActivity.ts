import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { queryKeys } from './queryKeys';

export function useActivityLogs(scope: 'workspace' | 'project', id: string | undefined, limit = 20) {
  return useQuery({
    queryKey: queryKeys.activityLogs(scope, id ?? ''),
    queryFn: () =>
      analyticsApi.getActivityLogs(scope === 'workspace' ? { workspaceId: id, limit } : { projectId: id, limit }),
    enabled: Boolean(id),
  });
}

export function useProjectAnalytics(projectId: string | undefined, days = 30) {
  return useQuery({
    queryKey: queryKeys.projectAnalytics(projectId ?? '', days),
    queryFn: () => analyticsApi.getProjectAnalytics(projectId!, days),
    enabled: Boolean(projectId),
  });
}
