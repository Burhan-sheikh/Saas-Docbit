import { cn } from '@/utils/cn';
import { initialsFromName } from '@/utils/format';

interface AvatarProps {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };

const colors = ['bg-brand-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-indigo-500'];

function colorFromString(str: string): string {
  const hash = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function Avatar({ name, email, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return <img src={src} alt={name || email || 'avatar'} className={cn('rounded-full object-cover', sizeMap[size], className)} />;
  }
  const initials = initialsFromName(name, email);
  return (
    <div className={cn('flex items-center justify-center rounded-full font-semibold text-white', sizeMap[size], colorFromString(name || email || '?'), className)}>
      {initials}
    </div>
  );
}
