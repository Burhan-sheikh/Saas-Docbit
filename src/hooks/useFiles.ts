import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { filesApi } from '@/lib/api/files';
import { queryKeys } from './queryKeys';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/lib/integrations/analytics';

export function useFileNodes(projectId: string | undefined, parentId: string | null) {
  return useQuery({
    queryKey: queryKeys.fileNodes(projectId ?? '', parentId),
    queryFn: () => filesApi.listChildren(projectId!, parentId),
    enabled: Boolean(projectId),
  });
}

export function useFileSearch(projectId: string | undefined, term: string) {
  return useQuery({
    queryKey: queryKeys.fileSearch(projectId ?? '', term),
    queryFn: () => filesApi.search(projectId!, term),
    enabled: Boolean(projectId) && term.trim().length > 0,
  });
}

export function useFileTrash(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.fileTrash(projectId ?? ''),
    queryFn: () => filesApi.listTrash(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useBreadcrumbs(nodeId: string | null) {
  return useQuery({
    queryKey: queryKeys.breadcrumbs(nodeId ?? 'root'),
    queryFn: () => filesApi.getBreadcrumbs(nodeId!),
    enabled: Boolean(nodeId),
  });
}

function invalidateProjectFiles(qc: ReturnType<typeof useQueryClient>, projectId: string) {
  qc.invalidateQueries({ queryKey: ['file-nodes', projectId] });
  qc.invalidateQueries({ queryKey: queryKeys.projectStats(projectId) });
  qc.invalidateQueries({ queryKey: ['file-trash', projectId] });
}

export function useCreateFolder(projectId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, name }: { parentId: string | null; name: string }) =>
      filesApi.createFolder(projectId, parentId, name, user!.id),
    onSuccess: () => {
      invalidateProjectFiles(qc, projectId);
      toast.success('Folder created');
    },
  });
}

export function useUploadFile(projectId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      parentId,
      file,
      onProgress,
    }: {
      parentId: string | null;
      file: File;
      onProgress?: (percent: number) => void;
    }) => filesApi.uploadFile(projectId, parentId, file, user!.id, onProgress),
    onSuccess: () => {
      invalidateProjectFiles(qc, projectId);
      trackEvent('file_uploaded');
    },
    onError: (err: Error) => toast.error(err.message || 'Upload failed'),
  });
}

export function useRenameNode(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => filesApi.rename(id, name),
    onSuccess: () => {
      invalidateProjectFiles(qc, projectId);
      toast.success('Renamed');
    },
  });
}

export function useMoveNodes(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, newParentId }: { ids: string[]; newParentId: string | null }) => filesApi.move(ids, newParentId),
    onSuccess: () => {
      invalidateProjectFiles(qc, projectId);
      toast.success('Moved');
    },
  });
}

export function useCopyNodes(projectId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, newParentId }: { ids: string[]; newParentId: string | null }) =>
      filesApi.copy(ids, newParentId, user!.id),
    onSuccess: () => {
      invalidateProjectFiles(qc, projectId);
      toast.success('Copied');
    },
  });
}

export function useDeleteNodes(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => filesApi.softDelete(ids),
    onSuccess: () => {
      invalidateProjectFiles(qc, projectId);
      toast.success('Moved to trash');
    },
  });
}

export function useRestoreNodes(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => filesApi.restore(ids),
    onSuccess: () => {
      invalidateProjectFiles(qc, projectId);
      toast.success('Restored');
    },
  });
}

export function usePermanentDeleteNodes(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => filesApi.permanentDelete(ids),
    onSuccess: () => {
      invalidateProjectFiles(qc, projectId);
      toast.success('Permanently deleted');
    },
  });
}
