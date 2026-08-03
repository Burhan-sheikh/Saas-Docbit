import { useNavigate } from 'react-router-dom';
import { CheckCheck, Bell } from 'lucide-react';
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/utils/format';
import { EmptyState } from '@/components/ui';
import { NotificationIcon } from './NotificationIcon';
import { cn } from '@/utils/cn';

export function NotificationsPreview({ onNavigate }: { onNavigate: () => void }) {
  const { data: notifications, isLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();
  const navigate = useNavigate();

  const items = (notifications ?? []).slice(0, 6);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
        <span className="text-sm font-semibold text-gray-900">Notifications</span>
        <button onClick={() => markAllRead.mutate()} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading && <div className="p-4 text-center text-xs text-gray-400">Loading…</div>}
        {!isLoading && items.length === 0 && (
          <EmptyState icon={<Bell className="h-5 w-5" />} title="No notifications yet" className="border-none py-8" />
        )}
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => {
              markRead.mutate(n.id);
              if (n.link) navigate(n.link);
              onNavigate();
            }}
            className={cn('flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50', !n.is_read && 'bg-brand-50/40')}
          >
            <NotificationIcon type={n.type} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{n.title}</p>
              <p className="line-clamp-2 text-xs text-gray-500">{n.message}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">{formatRelativeTime(n.created_at)}</p>
            </div>
            {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
          </button>
        ))}
      </div>

      <button
        onClick={() => { navigate('/notifications'); onNavigate(); }}
        className="w-full border-t border-gray-100 py-2.5 text-center text-xs font-medium text-brand-600 hover:bg-gray-50"
      >
        View all notifications
      </button>
    </div>
  );
}
