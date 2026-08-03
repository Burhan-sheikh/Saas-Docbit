import { supabase } from '@/lib/supabase/client';
import { uploadFileToB2, deleteFilesFromB2 } from '@/lib/integrations/storage';
import { categoryFromFileName, isExcludedFileType } from '@/utils/fileCategory';
import type { FileNode, FileCategory } from '@/types/database';

export const filesApi = {
  async listChildren(projectId: string, parentId: string | null): Promise<FileNode[]> {
    let query = supabase
      .from('file_nodes')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('type', { ascending: false })
      .order('name', { ascending: true });

    query = parentId ? query.eq('parent_id', parentId) : query.is('parent_id', null);

    const { data, error } = await query;
    if (error) throw error;
    return data as FileNode[];
  },

  async listSystemFolders(projectId: string): Promise<FileNode[]> {
    const { data, error } = await supabase
      .from('file_nodes')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_system_folder', true)
      .order('name');
    if (error) throw error;
    return data as FileNode[];
  },

  async search(projectId: string, term: string): Promise<FileNode[]> {
    const { data, error } = await supabase
      .from('file_nodes')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .ilike('name', `%${term}%`)
      .order('updated_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data as FileNode[];
  },

  async listTrash(projectId: string): Promise<FileNode[]> {
    const { data, error } = await supabase
      .from('file_nodes')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false });
    if (error) throw error;
    return data as FileNode[];
  },

  async getBreadcrumbs(nodeId: string): Promise<FileNode[]> {
    const path: FileNode[] = [];
    let currentId: string | null = nodeId;
    let guard = 0;
    while (currentId && guard < 30) {
      const { data, error } = await supabase.from('file_nodes').select('*').eq('id', currentId).single();
      if (error || !data) break;
      path.unshift(data as FileNode);
      currentId = (data as FileNode).parent_id;
      guard++;
    }
    return path;
  },

  async createFolder(projectId: string, parentId: string | null, name: string, createdBy: string): Promise<FileNode> {
    const { data, error } = await supabase
      .from('file_nodes')
      .insert({ project_id: projectId, parent_id: parentId, name, type: 'folder', created_by: createdBy })
      .select()
      .single();
    if (error) throw error;
    return data as FileNode;
  },

  /**
   * Uploads a file to B2, then records it in the correct auto-organized format folder
   * (or a custom folder if parentId is a user-created subfolder).
   */
  async uploadFile(
    projectId: string,
    parentId: string | null,
    file: File,
    createdBy: string,
    onProgress?: (percent: number) => void
  ): Promise<FileNode> {
    if (isExcludedFileType(file.name)) {
      throw new Error('Video and audio files are not supported on this platform.');
    }

    const category: FileCategory = categoryFromFileName(file.name);
    let targetParentId = parentId;

    if (!targetParentId) {
      const { data: systemFolder } = await supabase
        .from('file_nodes')
        .select('id')
        .eq('project_id', projectId)
        .eq('is_system_folder', true)
        .eq('category', category)
        .single();
      targetParentId = systemFolder?.id ?? null;
    }

    const { key, publicUrl } = await uploadFileToB2(projectId, file, onProgress);

    const { data, error } = await supabase
      .from('file_nodes')
      .insert({
        project_id: projectId,
        parent_id: targetParentId,
        name: file.name,
        type: 'file',
        category,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        storage_key: key,
        storage_url: publicUrl,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data as FileNode;
  },

  async rename(id: string, name: string): Promise<FileNode> {
    const { data, error } = await supabase.from('file_nodes').update({ name }).eq('id', id).select().single();
    if (error) throw error;
    return data as FileNode;
  },

  async move(ids: string[], newParentId: string | null): Promise<void> {
    const { error } = await supabase.from('file_nodes').update({ parent_id: newParentId }).in('id', ids);
    if (error) throw error;
  },

  async copy(nodeIds: string[], newParentId: string | null, userId: string): Promise<void> {
    const { data: nodes, error } = await supabase.from('file_nodes').select('*').in('id', nodeIds);
    if (error) throw error;

    const copies = (nodes as FileNode[]).map((n) => ({
      project_id: n.project_id,
      parent_id: newParentId,
      name: `${n.name} (copy)`,
      type: n.type,
      category: n.category,
      mime_type: n.mime_type,
      size_bytes: n.size_bytes,
      storage_key: n.storage_key,
      storage_url: n.storage_url,
      checksum: n.checksum,
      created_by: userId,
    }));

    const { error: insertError } = await supabase.from('file_nodes').insert(copies);
    if (insertError) throw insertError;
  },

  async softDelete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('file_nodes')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .in('id', ids);
    if (error) throw error;
  },

  async restore(ids: string[]): Promise<void> {
    const { error } = await supabase.from('file_nodes').update({ is_deleted: false, deleted_at: null }).in('id', ids);
    if (error) throw error;
  },

  async permanentDelete(ids: string[]): Promise<void> {
    const { data: nodes } = await supabase.from('file_nodes').select('storage_key').in('id', ids);
    const keys = (nodes ?? []).map((n) => n.storage_key).filter(Boolean) as string[];
    if (keys.length) await deleteFilesFromB2(keys);

    const { error } = await supabase.from('file_nodes').delete().in('id', ids);
    if (error) throw error;
  },

  async listByCategory(projectId: string, category: FileCategory): Promise<FileNode[]> {
    const { data, error } = await supabase
      .from('file_nodes')
      .select('*')
      .eq('project_id', projectId)
      .eq('category', category)
      .eq('type', 'file')
      .eq('is_deleted', false)
      .order('name');
    if (error) throw error;
    return data as FileNode[];
  },
};
