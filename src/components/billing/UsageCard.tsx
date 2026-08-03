import { ProgressBar } from '@/components/ui';
import { formatBytes } from '@/utils/format';

interface UsageCardProps {
  label: string;
  used: number;
  max: number;
  formatValue?: (v: number) => string;
}

export function UsageCard({ label, used, max, formatValue }: UsageCardProps) {
  const format = formatValue ?? ((v: number) => String(v));
  const pct = max > 0 ? (used / max) * 100 : 0;
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{format(used)} / {max >= 900 ? 'Unlimited' : format(max)}</span>
      </div>
      <ProgressBar value={used} max={max} variant={pct > 90 ? 'red' : pct > 70 ? 'yellow' : 'brand'} />
    </div>
  );
}
