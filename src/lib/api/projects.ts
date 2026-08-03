import { supabase } from '@/lib/supabase/client';
import type { Project, ProjectStats } from '@/types/database';

export interface ProjectWithStats extends Project {
  stats: ProjectStats;
  workspace_name?: string;
}

export const projectsApi = {
  async list(
    workspaceId: string,
    opts?: { status?: 'active' | 'archived'; search?: string; sort?: 'name' | 'updated_at' | 'created_at'; order?: 'asc' | 'desc' }
  ): Promise<ProjectWithStats[]> {
    let query = supabase.from('projects').select('*').eq('workspace_id', workspaceId);

    if (opts?.status) query = query.eq('status', opts.status);
    else query = query.eq('status', 'active');

    if (opts?.search) query = query.ilike('name', `%${opts.search}%`);

    query = query.order(opts?.sort ?? 'updated_at', { ascending: opts?.order === 'asc' });

    const { data, error } = await query;
    if (error) throw error;

    const ids = (data ?? []).map((p) => p.id);
    const { data: stats } = await supabase.from('project_stats').select('*').in('project_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    const statsMap = new Map((stats ?? []).map((s) => [s.project_id, s as ProjectStats]));

    return (data ?? []).map((p) => ({
      ...(p as Project),
      stats: statsMap.get(p.id) ?? { project_id: p.id, file_count: 0, folder_count: 0, member_count: 0, link_count: 0, storage_used_bytes: 0 },
    }));
  },

  async listRecent(userId: string, limit = 6): Promise<ProjectWithStats[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, workspace:workspaces(name)')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error) throw error;

    const ids = (data ?? []).map((p) => p.id);
    const { data: stats } = await supabase.from('project_stats').select('*').in('project_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    const statsMap = new Map((stats ?? []).map((s) => [s.project_id, s as ProjectStats]));

    return (data ?? []).map((p: any) => ({
      ...(p as Project),
      workspace_name: p.workspace?.name,
      stats: statsMap.get(p.id) ?? { project_id: p.id, file_count: 0, folder_count: 0, member_count: 0, link_count: 0, storage_used_bytes: 0 },
    }));
  },

  async getById(id: string): Promise<Project> {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Project;
  },

  async getStats(id: string): Promise<ProjectStats> {
    const { data, error } = await supabase.from('project_stats').select('*').eq('project_id', id).single();
    if (error) throw error;
    return data as ProjectStats;
  },

  async create(workspaceId: string, ownerId: string, name: string, description?: string, icon?: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert({ workspace_id: workspaceId, owner_id: ownerId, name, description: description || null, icon: icon || null })
      .select()
      .single();
    if (error) throw error;
    return data as Project;
  },

  async rename(id: string, name: string): Promise<Project> {
    const { data, error } = await supabase.from('projects').update({ name }).eq('id', id).select().single();
    if (error) throw error;
    return data as Project;
  },

  async updateDetails(id: string, updates: Partial<Pick<Project, 'description' | 'icon'>>): Promise<Project> {
    const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Project;
  },

  async moveToWorkspace(id: string, workspaceId: string): Promise<Project> {
    const { data, error } = await supabase.from('projects').update({ workspace_id: workspaceId }).eq('id', id).select().single();
    if (error) throw error;
    return data as Project;
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase.from('projects').update({ status: 'archived', archived_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  async restore(id: string): Promise<void> {
    const { error } = await supabase.from('projects').update({ status: 'active', archived_at: null }).eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },
};
