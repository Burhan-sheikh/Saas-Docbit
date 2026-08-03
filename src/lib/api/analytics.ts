import { supabase } from '@/lib/supabase/client';
import type { AnalyticsEvent, ActivityLog } from '@/types/database';

export const analyticsApi = {
  async recordEvent(
    projectId: string,
    eventType: AnalyticsEvent['event_type'],
    actorId: string | null,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const { error } = await supabase
      .from('analytics_events')
      .insert({ project_id: projectId, event_type: eventType, actor_id: actorId, metadata });
    if (error) throw error;
  },

  async getProjectAnalytics(projectId: string, days = 30) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('project_id', projectId)
      .gte('created_at', since)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as AnalyticsEvent[];
  },

  async getActivityLogs(opts: { workspaceId?: string; projectId?: string; limit?: number }): Promise<ActivityLog[]> {
    let query = supabase
      .from('activity_logs')
      .select('*, actor:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(opts.limit ?? 20);

    if (opts.workspaceId) query = query.eq('workspace_id', opts.workspaceId);
    if (opts.projectId) query = query.eq('project_id', opts.projectId);

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as ActivityLog[];
  },

  async logActivity(input: {
    workspaceId?: string | null;
    projectId?: string | null;
    actorId: string;
    action: string;
    targetType: string;
    targetId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await supabase.from('activity_logs').insert({
      workspace_id: input.workspaceId ?? null,
      project_id: input.projectId ?? null,
      actor_id: input.actorId,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId ?? null,
      metadata: input.metadata ?? {},
    });
    if (error) throw error;
  },
};
