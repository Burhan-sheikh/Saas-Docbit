import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'gray' | 'brand' | 'green' | 'red' | 'yellow' | 'purple';

const styles: Record<BadgeVariant, string> = {
  gray: 'bg-gray-100 text-gray-700',
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  yellow: 'bg-amber-50 text-amber-700',
  purple: 'bg-purple-50 text-purple-700',
};

export function Badge({ children, variant = 'gray', className }: { children: ReactNode; variant?: BadgeVariant; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', styles[variant], className)}>
      {children}
    </span>
  );
}
