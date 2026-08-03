import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, label, id, ...props }, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-2 select-none">
      <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <input ref={ref} type="checkbox" id={inputId} className="peer absolute h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:border-brand-600 checked:bg-brand-600 focus-ring" {...props} />
        <Check className={cn('pointer-events-none h-3 w-3 text-white opacity-0 peer-checked:opacity-100', className)} />
      </span>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
});
Checkbox.displayName = 'Checkbox';
