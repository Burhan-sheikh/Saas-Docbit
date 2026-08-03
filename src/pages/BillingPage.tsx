import { useState } from 'react';
import { CreditCard, Info } from 'lucide-react';
import { usePlans, useMySubscription, useUsageSummary, useChangePlan, useCancelSubscription, useResumeSubscription } from '@/hooks/useBilling';
import { PlanCard } from '@/components/billing/PlanCard';
import { UsageCard } from '@/components/billing/UsageCard';
import { Button, Badge, Skeleton } from '@/components/ui';
import { formatBytes, formatDate } from '@/utils/format';
import type { BillingCycle } from '@/types/database';

export function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: subscription } = useMySubscription();
  const { data: usage } = useUsageSummary();
  const changePlan = useChangePlan();
  const cancelSubscription = useCancelSubscription();
  const resumeSubscription = useResumeSubscription();

  const isMockMode = (import.meta.env.VITE_BILLING_MODE as string | undefined) !== 'razorpay';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Billing & plans</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your subscription and usage limits.</p>
      </div>

      {isMockMode && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Payments are running in mock mode — plan changes apply immediately without a real charge. Connect Razorpay keys to enable live billing.</p>
        </div>
      )}

      {subscription && (
        <div className="card flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {subscription.plan?.name} plan · <Badge variant={subscription.status === 'active' ? 'green' : 'gray'}>{subscription.status}</Badge>
              </p>
              <p className="text-xs text-gray-500">
                Renews {formatDate(subscription.current_period_end)}
                {subscription.cancel_at_period_end && ' · Cancels at period end'}
              </p>
            </div>
          </div>
          {subscription.plan?.slug !== 'free' && (
            subscription.cancel_at_period_end ? (
              <Button variant="outline" size="sm" onClick={() => resumeSubscription.mutate()} isLoading={resumeSubscription.isPending}>
                Resume subscription
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => cancelSubscription.mutate()} isLoading={cancelSubscription.isPending}>
                Cancel at period end
              </Button>
            )
          )}
        </div>
      )}

      {usage && subscription?.plan && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <UsageCard label="Workspaces" used={usage.workspaceCount} max={subscription.plan.max_workspaces} />
          <UsageCard label="Projects" used={usage.projectCount} max={subscription.plan.max_projects_per_workspace * Math.max(usage.workspaceCount, 1)} />
          <UsageCard label="Storage" used={usage.storageUsedBytes} max={subscription.plan.max_storage_bytes} formatValue={formatBytes} />
        </div>
      )}

      <div className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit mx-auto">
        <button onClick={() => setBillingCycle('monthly')} className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          Monthly
        </button>
        <button onClick={() => setBillingCycle('yearly')} className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${billingCycle === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          Yearly <span className="text-emerald-600">save ~17%</span>
        </button>
      </div>

      {plansLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans?.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              isCurrent={subscription?.plan?.id === plan.id}
              isLoading={changePlan.isPending}
              onSelect={() => changePlan.mutate({ planId: plan.id, billingCycle })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
