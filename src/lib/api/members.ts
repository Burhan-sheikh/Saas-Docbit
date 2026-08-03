import { supabase } from '@/lib/supabase/client';
import type { ProjectMember, ProjectPermissionRequest, ProjectRole } from '@/types/database';

export const membersApi = {
  async list(projectId: string): Promise<ProjectMember[]> {
    const { data, error } = await supabase
      .from('project_members')
      .select('*, profile:profiles(*)')
      .eq('project_id', projectId)
      .order('created_at');
    if (error) throw error;
    return data as unknown as ProjectMember[];
  },

  /** Invites multiple emails at once. Existing users are linked immediately; others are pending invites. */
  async inviteMany(projectId: string, emails: string[], role: ProjectRole, invitedBy: string): Promise<void> {
    const cleanEmails = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];

    const { data: existingProfiles } = await supabase.from('profiles').select('id, email').in('email', cleanEmails);
    const profileByEmail = new Map((existingProfiles ?? []).map((p) => [p.email.toLowerCase(), p.id]));

    const rows = cleanEmails.map((email) => {
      const userId = profileByEmail.get(email);
      return {
        project_id: projectId,
        user_id: userId ?? null,
        role,
        invited_by: invitedBy,
        invited_email: email,
        accepted: Boolean(userId),
      };
    });

    const { error } = await supabase.from('project_members').upsert(rows, { onConflict: 'project_id,user_id', ignoreDuplicates: false });
    if (error) throw error;
  },

  async updateRole(memberId: string, role: ProjectRole): Promise<void> {
    const { error } = await supabase.from('project_members').update({ role }).eq('id', memberId);
    if (error) throw error;
  },

  async remove(memberId: string): Promise<void> {
    const { error } = await supabase.from('project_members').delete().eq('id', memberId);
    if (error) throw error;
  },

  async listPendingInvites(projectId: string): Promise<ProjectMember[]> {
    const { data, error } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('accepted', false);
    if (error) throw error;
    return data as ProjectMember[];
  },

  async listPermissionRequests(projectId: string): Promise<ProjectPermissionRequest[]> {
    const { data, error } = await supabase
      .from('project_permission_requests')
      .select('*, requester:profiles(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as ProjectPermissionRequest[];
  },

  async createPermissionRequest(projectId: string, requesterId: string, reason?: string): Promise<ProjectPermissionRequest> {
    const { data, error } = await supabase
      .from('project_permission_requests')
      .insert({ project_id: projectId, requester_id: requesterId, reason: reason || null })
      .select()
      .single();
    if (error) throw error;
    return data as ProjectPermissionRequest;
  },

  async resolvePermissionRequest(requestId: string, approve: boolean, role: ProjectRole = 'viewer'): Promise<void> {
    const { error } = await supabase.rpc('resolve_permission_request', {
      p_request_id: requestId,
      p_approve: approve,
      p_role: role,
    });
    if (error) throw error;
  },

  async getMyAccess(projectId: string, userId: string): Promise<ProjectMember | null> {
    const { data, error } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('accepted', true)
      .maybeSingle();
    if (error) throw error;
    return data as ProjectMember | null;
  },
};
