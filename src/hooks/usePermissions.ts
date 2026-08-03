import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProjectMembers } from './useMembers';
import type { ProjectRole } from '@/types/database';

/** Resolves the current user's role & derived capability flags for a project. */
export function useProjectPermissions(projectId: string | undefined) {
  const { user } = useAuth();
  const { data: members, isLoading } = useProjectMembers(projectId);

  return useMemo(() => {
    const membership = members?.find((m) => m.user_id === user?.id && m.accepted);
    const role: ProjectRole | null = membership?.role ?? null;

    return {
      isLoading,
      role,
      isOwner: role === 'owner',
      isEditor: role === 'owner' || role === 'editor',
      isViewer: role === 'viewer',
      hasAccess: Boolean(role),
      canUpload: role === 'owner' || role === 'editor',
      canDelete: role === 'owner' || role === 'editor',
      canShare: role === 'owner' || role === 'editor',
      canManageMembers: role === 'owner',
      canEditSettings: role === 'owner',
    };
  }, [members, user?.id, isLoading]);
}
