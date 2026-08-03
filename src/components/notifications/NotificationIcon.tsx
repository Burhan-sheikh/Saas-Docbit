import { FolderPlus, RefreshCw, Building2, Link2, Clock, UserCheck, UserX, Users, UserMinus, HardDrive, ArrowUpCircle, CreditCard, ShieldAlert } from 'lucide-react';
import type { NotificationType } from '@/types/database';

const iconMap: Record<NotificationType, { icon: typeof FolderPlus; color: string }> = {
  project_created: { icon: FolderPlus, color: 'text-brand-600 bg-brand-50' },
  project_updated: { icon: RefreshCw, color: 'text-brand-600 bg-brand-50' },
  workspace_updated: { icon: Building2, color: 'text-purple-600 bg-purple-50' },
  link_generated: { icon: Link2, color: 'text-emerald-600 bg-emerald-50' },
  link_expired: { icon: Clock, color: 'text-amber-600 bg-amber-50' },
  permission_request: { icon: ShieldAlert, color: 'text-amber-600 bg-amber-50' },
  permission_approved: { icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
  permission_denied: { icon: UserX, color: 'text-red-600 bg-red-50' },
  member_joined: { icon: Users, color: 'text-brand-600 bg-brand-50' },
  member_removed: { icon: UserMinus, color: 'text-red-600 bg-red-50' },
  storage_limit_reached: { icon: HardDrive, color: 'text-red-600 bg-red-50' },
  plan_upgraded: { icon: ArrowUpCircle, color: 'text-emerald-600 bg-emerald-50' },
  plan_expired: { icon: CreditCard, color: 'text-red-600 bg-red-50' },
  billing_updated: { icon: CreditCard, color: 'text-brand-600 bg-brand-50' },
};

export function NotificationIcon({ type }: { type: NotificationType }) {
  const { icon: Icon, color } = iconMap[type] ?? iconMap.project_updated;
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}
