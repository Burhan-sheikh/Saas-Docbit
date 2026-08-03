import { Check } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Plan, BillingCycle } from '@/types/database';

interface PlanCardProps {
  plan: Plan;
  billingCycle: BillingCycle;
  isCurrent: boolean;
  onSelect: () => void;
  isLoading: boolean;
}

export function PlanCard({ plan, billingCycle, isCurrent, onSelect, isLoading }: PlanCardProps) {
  const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;

  return (
    <div className={cn('card flex flex-col p-5', isCurrent && 'border-brand-400 ring-1 ring-brand-400')}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
        {isCurrent && <Badge variant="brand">Current plan</Badge>}
      </div>
      <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">{price === 0 ? 'Free' : formatCurrency(price)}</span>
        {price > 0 && <span className="text-sm text-gray-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>}
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {feature}
          </li>
        ))}
      </ul>

      <Button className="mt-5" variant={isCurrent ? 'outline' : 'primary'} fullWidth disabled={isCurrent} isLoading={isLoading} onClick={onSelect}>
        {isCurrent ? 'Current plan' : 'Switch to this plan'}
      </Button>
    </div>
  );
}
