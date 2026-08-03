import { supabase } from '@/lib/supabase/client';
import { randomSlug } from '@/utils/slug';
import type { ProjectLink, LinkTargetType } from '@/types/database';

export interface CreateLinkInput {
  projectId: string;
  targetType: LinkTargetType;
  targetIds: string[];
  customSlug?: string;
  password?: string;
  expiresInDays?: number;
  maxDownloads?: number;
  requireLogin: boolean;
  permission: 'view' | 'download';
  createdBy: string;
}

// Lightweight browser-safe hash for demo password protection.
// Real verification against this hash happens via the resolve_share_link RPC + client compare.
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const linksApi = {
  async list(projectId: string): Promise<ProjectLink[]> {
    const { data, error } = await supabase
      .from('project_links')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as ProjectLink[];
  },

  async create(input: CreateLinkInput): Promise<ProjectLink> {
    const slug = input.customSlug?.trim() || randomSlug(8);
    const passwordHash = input.password ? await hashPassword(input.password) : null;
    const expiresAt = input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 86400000).toISOString() : null;

    const { data, error } = await supabase
      .from('project_links')
      .insert({
        project_id: input.projectId,
        target_type: input.targetType,
        target_ids: input.targetIds,
        slug,
        password_hash: passwordHash,
        expires_at: expiresAt,
        max_downloads: input.maxDownloads || null,
        require_login: input.requireLogin,
        permission: input.permission,
        created_by: input.createdBy,
      })
      .select()
      .single();
    if (error) throw error;
    return data as ProjectLink;
  },

  async update(id: string, updates: Partial<Pick<ProjectLink, 'is_active' | 'expires_at' | 'max_downloads' | 'require_login' | 'permission'>>): Promise<ProjectLink> {
    const { data, error } = await supabase.from('project_links').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as ProjectLink;
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase.from('project_links').update({ is_active: isActive }).eq('id', id);
    if (error) throw error;
  },

  async regenerateSlug(id: string): Promise<ProjectLink> {
    const { data, error } = await supabase
      .from('project_links')
      .update({ slug: randomSlug(8) })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as ProjectLink;
  },

  async duplicate(link: ProjectLink): Promise<ProjectLink> {
    const { data, error } = await supabase
      .from('project_links')
      .insert({
        project_id: link.project_id,
        target_type: link.target_type,
        target_ids: link.target_ids,
        slug: randomSlug(8),
        password_hash: link.password_hash,
        expires_at: link.expires_at,
        max_downloads: link.max_downloads,
        require_login: link.require_login,
        permission: link.permission,
        created_by: link.created_by,
      })
      .select()
      .single();
    if (error) throw error;
    return data as ProjectLink;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('project_links').delete().eq('id', id);
    if (error) throw error;
  },

  async resolvePublic(slug: string) {
    const { data, error } = await supabase.rpc('resolve_share_link', { p_slug: slug });
    if (error) throw error;
    return data?.[0] ?? null;
  },

  async resolvePublicContents(slug: string) {
    const { data, error } = await supabase.rpc('resolve_share_link_contents', { p_slug: slug });
    if (error) throw error;
    return (data ?? []) as Pick<import('@/types/database').FileNode, 'id' | 'parent_id' | 'name' | 'type' | 'category' | 'mime_type' | 'size_bytes' | 'storage_url' | 'created_at'>[];
  },

  async verifyPassword(slug: string, password: string): Promise<boolean> {
    const { data, error } = await supabase.from('project_links').select('password_hash').eq('slug', slug).single();
    if (error || !data) return false;
    if (!data.password_hash) return true;
    const hash = await hashPassword(password);
    return hash === data.password_hash;
  },

  async recordEvent(slug: string, event: 'link_view' | 'link_download') {
    await supabase.rpc('record_link_event', { p_slug: slug, p_event: event });
  },

  buildShareUrl(slug: string): string {
    return `${window.location.origin}/s/${slug}`;
  },
};
