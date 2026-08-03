import { cn } from '@/utils/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  variant?: 'brand' | 'green' | 'red' | 'yellow';
}

const colorMap = { brand: 'bg-brand-600', green: 'bg-emerald-500', red: 'bg-red-500', yellow: 'bg-amber-500' };

export function ProgressBar({ value, max = 100, className, variant = 'brand' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-gray-100', className)}>
      <div className={cn('h-full rounded-full transition-all duration-500', colorMap[variant])} style={{ width: `${pct}%` }} />
    </div>
  );
}
