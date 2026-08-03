import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { billingApi } from '@/lib/api/billing';
import { queryKeys } from './queryKeys';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/lib/integrations/analytics';
import type { BillingCycle } from '@/types/database';

export function usePlans() {
  return useQuery({ queryKey: queryKeys.plans(), queryFn: () => billingApi.listPlans() });
}

export function useMySubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.subscription(user?.id ?? ''),
    queryFn: () => billingApi.getMySubscription(user!.id),
    enabled: Boolean(user?.id),
  });
}

export function useUsageSummary() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.usageSummary(user?.id ?? ''),
    queryFn: () => billingApi.getUsageSummary(user!.id),
    enabled: Boolean(user?.id),
  });
}

export function useChangePlan() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, billingCycle }: { planId: string; billingCycle: BillingCycle }) =>
      billingApi.changePlan(user!.id, planId, billingCycle),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subscription(user?.id ?? '') });
      trackEvent('plan_changed');
      toast.success('Plan updated successfully');
    },
    onError: () => toast.error('Could not update your plan'),
  });
}

export function useCancelSubscription() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => billingApi.cancelAtPeriodEnd(user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subscription(user?.id ?? '') });
      toast.success('Subscription will cancel at period end');
    },
  });
}

export function useResumeSubscription() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => billingApi.resumeSubscription(user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subscription(user?.id ?? '') });
      toast.success('Subscription resumed');
    },
  });
}
