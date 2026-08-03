import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  accent?: 'brand' | 'purple' | 'emerald' | 'amber';
}

const accentMap = {
  brand: 'bg-brand-50 text-brand-600',
  purple: 'bg-purple-50 text-purple-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
};

export function StatCard({ label, value, icon, trend, trendUp, accent = 'brand' }: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', accentMap[accent])}>{icon}</div>
      </div>
      {trend && (
        <p className={cn('mt-2 text-xs font-medium', trendUp ? 'text-emerald-600' : 'text-gray-400')}>{trend}</p>
      )}
    </div>
  );
}
