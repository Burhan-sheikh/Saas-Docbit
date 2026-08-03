import { supabase } from '@/lib/supabase/client';
import type { Plan, Subscription, BillingCycle } from '@/types/database';

export const billingApi = {
  async listPlans(): Promise<Plan[]> {
    const { data, error } = await supabase.from('plans').select('*').eq('is_active', true).order('price_monthly');
    if (error) throw error;
    return (data ?? []).map((p) => ({ ...p, features: p.features as string[] })) as Plan[];
  },

  async getMySubscription(userId: string): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data as unknown as Subscription;
  },

  /**
   * Mock payment success flow: swaps the user's plan immediately, marking the
   * subscription as provider = 'mock'. Once Razorpay keys exist, swap this for
   * a real checkout + webhook-driven update without changing calling code.
   */
  async changePlan(userId: string, planId: string, billingCycle: BillingCycle): Promise<Subscription> {
    const periodEnd = new Date();
    if (billingCycle === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        plan_id: planId,
        billing_cycle: billingCycle,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        provider: 'mock',
      })
      .eq('user_id', userId)
      .select('*, plan:plans(*)')
      .single();
    if (error) throw error;
    return data as unknown as Subscription;
  },

  async cancelAtPeriodEnd(userId: string): Promise<void> {
    const { error } = await supabase.from('subscriptions').update({ cancel_at_period_end: true }).eq('user_id', userId);
    if (error) throw error;
  },

  async resumeSubscription(userId: string): Promise<void> {
    const { error } = await supabase.from('subscriptions').update({ cancel_at_period_end: false }).eq('user_id', userId);
    if (error) throw error;
  },

  async getUsageSummary(userId: string) {
    const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', userId).eq('status', 'active');
    const workspaceIds = (workspaces ?? []).map((w) => w.id);

    let projectCount = 0;
    if (workspaceIds.length) {
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('workspace_id', workspaceIds)
        .eq('status', 'active');
      projectCount = count ?? 0;
    }

    const { data: usageRows } = await supabase
      .from('storage_usage')
      .select('bytes_used, project_id, projects!inner(owner_id)')
      .eq('projects.owner_id', userId);

    const storageUsed = (usageRows ?? []).reduce((sum, r: any) => sum + (r.bytes_used ?? 0), 0);

    return {
      workspaceCount: workspaceIds.length,
      projectCount,
      storageUsedBytes: storageUsed,
    };
  },
};
