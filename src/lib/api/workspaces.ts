import { supabase } from '@/lib/supabase/client';
import { slugify, randomSlug } from '@/utils/slug';
import type { Workspace, WorkspaceMember, WorkspaceStats } from '@/types/database';

export interface WorkspaceWithStats extends Workspace {
  stats: WorkspaceStats;
  is_favorite: boolean;
  member_role: string | null;
}

export const workspacesApi = {
  async list(userId: string, opts?: { status?: 'active' | 'archived'; search?: string }): Promise<WorkspaceWithStats[]> {
    let query = supabase
      .from('workspaces')
      .select('*, workspace_members!inner(role, is_favorite, user_id)')
      .eq('workspace_members.user_id', userId)
      .order('updated_at', { ascending: false });

    if (opts?.status) query = query.eq('status', opts.status);
    if (opts?.search) query = query.ilike('name', `%${opts.search}%`);

    const { data, error } = await query;
    if (error) throw error;

    const ids = (data ?? []).map((w) => w.id);
    const { data: stats } = await supabase.from('workspace_stats').select('*').in('workspace_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    const statsMap = new Map((stats ?? []).map((s) => [s.workspace_id, s as WorkspaceStats]));

    return (data ?? []).map((w) => {
      const member = Array.isArray(w.workspace_members) ? w.workspace_members[0] : w.workspace_members;
      return {
        ...(w as unknown as Workspace),
        is_favorite: member?.is_favorite ?? false,
        member_role: member?.role ?? null,
        stats: statsMap.get(w.id) ?? { workspace_id: w.id, project_count: 0, member_count: 0, storage_used_bytes: 0 },
      };
    });
  },

  async getById(id: string): Promise<Workspace> {
    const { data, error } = await supabase.from('workspaces').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Workspace;
  },

  async getStats(id: string): Promise<WorkspaceStats> {
    const { data, error } = await supabase.from('workspace_stats').select('*').eq('workspace_id', id).single();
    if (error) throw error;
    return data as WorkspaceStats;
  },

  async create(ownerId: string, name: string, description?: string): Promise<Workspace> {
    const baseSlug = slugify(name) || 'workspace';
    const slug = `${baseSlug}-${randomSlug(5).toLowerCase()}`;

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name, description: description || null, slug, owner_id: ownerId })
      .select()
      .single();
    if (error) throw error;
    return data as Workspace;
  },

  async rename(id: string, name: string): Promise<Workspace> {
    const { data, error } = await supabase.from('workspaces').update({ name }).eq('id', id).select().single();
    if (error) throw error;
    return data as Workspace;
  },

  async updateDescription(id: string, description: string): Promise<Workspace> {
    const { data, error } = await supabase.from('workspaces').update({ description }).eq('id', id).select().single();
    if (error) throw error;
    return data as Workspace;
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase.from('workspaces').update({ status: 'archived', archived_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  async restore(id: string): Promise<void> {
    const { error } = await supabase.from('workspaces').update({ status: 'active', archived_at: null }).eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('workspaces').delete().eq('id', id);
    if (error) throw error;
  },

  async toggleFavorite(workspaceId: string, userId: string, isFavorite: boolean): Promise<void> {
    const { error } = await supabase
      .from('workspace_members')
      .update({ is_favorite: isFavorite })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*, profile:profiles(*)')
      .eq('workspace_id', workspaceId)
      .order('created_at');
    if (error) throw error;
    return data as unknown as WorkspaceMember[];
  },
};
