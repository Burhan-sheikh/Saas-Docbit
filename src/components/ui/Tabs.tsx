import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface Tab {
  value: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div className={cn('scrollbar-none flex gap-1 overflow-x-auto border-b border-gray-200', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
            value === tab.value ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-800'
          )}
        >
          {tab.icon}
          {tab.label}
          {typeof tab.count === 'number' && (
            <span className={cn('rounded-full px-1.5 py-0.5 text-[11px]', value === tab.value ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-500')}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
